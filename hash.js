import bcrypt from "bcrypt";

async function hashPassword(password) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log("Hashed Password:", hashedPassword);
}

hashPassword("Muskaan@9494");  // Replace with your actual password

