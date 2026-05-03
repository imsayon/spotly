const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'syrusop09@gmail.com' } });
  if (!user) return console.log("User not found");
  
  // mock a supabase JWT
  const token = jwt.sign({
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: user.id,
    email: user.email,
  }, process.env.SUPABASE_JWT_SECRET || 'super-secret-jwt-token-with-at-least-32-characters-long');
  
  console.log("Token generated for:", user.id);
  
  try {
    const res = await fetch('http://localhost:3001/api/merchant/me/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log("Profile response:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}
main().finally(() => prisma.$disconnect());
