-- Update the current authenticated user to admin role
UPDATE profiles 
SET role = 'admin' 
WHERE user_id = 'a30fdee9-b8b6-45e0-a947-d4f9043480f3';