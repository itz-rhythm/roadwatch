const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'roadwatch',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432,
});

// Suppress unhandled pool errors when postgres is offline
pool.on('error', (err) => {
  console.log('Postgres pool error (offline mode active):', err.message);
});

// In-Memory Database Fallback Store
const MEMORY_DB = {
  users: [
    { id: 1, name: 'Admin User', email: 'admin@roadwatch.org', phone: '9999999999', role: 'admin', is_verified: true },
    { id: 2, name: 'Authority Officer', email: 'authority@roadwatch.org', phone: '8888888888', role: 'authority', is_verified: true },
    { id: 3, name: 'Citizen User', email: 'citizen@roadwatch.org', phone: '7777777777', role: 'citizen', is_verified: true },
  ],
  complaints: [],
  contractors: [
    { id: 1, name: 'L&T Construction', average_rating: 4.8, total_roads_built: 120, total_roads_failed: 2, blacklisted: false, failure_frequency_score: 0.8, corruption_flagged: false },
    { id: 2, name: 'NCC Limited', average_rating: 4.3, total_roads_built: 88, total_roads_failed: 3, blacklisted: false, failure_frequency_score: 1.2, corruption_flagged: false },
    { id: 3, name: 'J Kumar Infra', average_rating: 4.1, total_roads_built: 45, total_roads_failed: 4, blacklisted: false, failure_frequency_score: 2.1, corruption_flagged: false },
    { id: 4, name: 'Dilip Buildcon', average_rating: 3.2, total_roads_built: 78, total_roads_failed: 9, blacklisted: false, failure_frequency_score: 4.8, corruption_flagged: false },
    { id: 5, name: 'Apex Road Works', average_rating: 2.8, total_roads_built: 33, total_roads_failed: 8, blacklisted: false, failure_frequency_score: 5.9, corruption_flagged: true },
    { id: 6, name: 'Shady Builders Co', average_rating: 1.2, total_roads_built: 15, total_roads_failed: 12, blacklisted: true, failure_frequency_score: 9.4, corruption_flagged: true },
  ],
  roads: [],
  notifications: []
};

// Check if we should use memory DB (starts when connection check fails)
let useMemoryDb = false;

// Simple query parser for in-memory database simulation
function handleInMemoryQuery(text, params) {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ');

  // 1. SELECT FROM users
  if (normalized.includes('select * from users')) {
    if (normalized.includes('email = $1 or phone = $2') || normalized.includes('email = $1')) {
      const val = params[0];
      const match = MEMORY_DB.users.find(u => u.email === val || u.phone === val);
      return { rows: match ? [match] : [] };
    }
    if (normalized.includes('where id = $1')) {
      const match = MEMORY_DB.users.find(u => u.id === Number(params[0]));
      return { rows: match ? [match] : [] };
    }
    return { rows: MEMORY_DB.users };
  }

  // 2. INSERT INTO users
  if (normalized.includes('insert into users')) {
    const [name, phone, email, role, ward_id] = params;
    const newUser = {
      id: MEMORY_DB.users.length + 1,
      name, phone, email, role,
      ward_id: Number(ward_id || 1),
      is_verified: true
    };
    MEMORY_DB.users.push(newUser);
    return { rows: [newUser] };
  }

  // 3. SELECT FROM contractors
  if (normalized.includes('select * from contractors')) {
    return { rows: MEMORY_DB.contractors };
  }

  // 4. UPDATE contractors (blacklist / flag)
  if (normalized.includes('update contractors')) {
    if (normalized.includes('corruption_risk_flag = $1, blacklisted = $2')) {
      const [flag, black, id] = params;
      const c = MEMORY_DB.contractors.find(x => x.id === Number(id));
      if (c) {
        c.corruption_flagged = flag;
        c.blacklisted = black;
      }
    } else if (normalized.includes('corruption_risk_flag = true')) {
      const [id] = params;
      const c = MEMORY_DB.contractors.find(x => x.id === Number(id));
      if (c) c.corruption_flagged = true;
    }
    return { rows: [] };
  }

  // 5. Default fallback
  return { rows: [] };
}

module.exports = {
  query: async (text, params) => {
    if (useMemoryDb) {
      return handleInMemoryQuery(text, params);
    }
    try {
      return await pool.query(text, params);
    } catch (err) {
      // If DB connection fails, enable fallback to memory database
      if (err.code === 'ECONNREFUSED' || err.message.includes('connect')) {
        if (!useMemoryDb) {
          console.warn('⚠️ WARNING: PostgreSQL is offline. Falling back to in-memory database mode for local testing.');
          useMemoryDb = true;
        }
        return handleInMemoryQuery(text, params);
      }
      throw err;
    }
  },
  pool
};
