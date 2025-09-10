const { Pool } = require('pg');

const pool = new Pool({
  host: 'aws-1-eu-west-3.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.cilwtabzyldnbdhyagro',
  password: 'Diallo123!!'
});

pool.query('SELECT COUNT(*) as admin_count FROM admin_users', (err, res) => {
  if (err) {
    console.error('Erreur:', err);
  } else {
    console.log('Connexion réussie! Admins trouvés:', res.rows[0].admin_count);
    console.log('Base de données prête pour la production!');
  }
  pool.end();
});