-- This script uses the pgcrypto extension to generate a valid bcrypt hash
-- which is compatible with the Node.js bcryptjs library used by your application.

-- 1. Enable the pgcrypto extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Insert the new admin
-- Replace 'newadmin@domain.com' with the desired email
-- Replace 'YourSecurePasswordHere123!' with the desired password
INSERT INTO admins (email, password) VALUES ('huynhgiahuy071003@gmail.com', crypt('admin', gen_salt('bf', 10)));

-- Note: The `gen_salt('bf', 10)` generates a bcrypt salt with a cost factor of 10,
-- which exactly matches the `bcrypt.hashSync('...', 10)` used in your db.ts file.
