-- Insert sample verification requests for testing
INSERT INTO public.medical_verification (
  user_id,
  verification_status,
  specialty,
  license_number,
  institution_name,
  years_of_experience,
  verification_notes,
  submitted_at
) VALUES 
(
  'a30fdee9-b8b6-45e0-a947-d4f9043480f3',
  'pending',
  'general_medicine',
  'MD-2024-001',
  'Mulago National Referral Hospital',
  5,
  'Experienced general practitioner specializing in primary care.',
  now()
),
(
  '70cbfeac-91a6-48ac-b8f4-bf9673ab01d8',
  'pending', 
  'cardiology',
  'CARD-2024-002',
  'Uganda Heart Institute',
  8,
  'Certified cardiologist with expertise in interventional procedures.',
  now() - interval '2 days'
),
(
  'd588630b-6661-4646-99a4-82dae86bf151',
  'pending',
  'pediatrics',
  'PED-2024-003', 
  'Mbarara University Teaching Hospital',
  3,
  'Pediatric specialist focusing on child healthcare and development.',
  now() - interval '1 day'
);