-- Add first_name column to profiles table
ALTER TABLE public.profiles ADD COLUMN first_name TEXT;

-- Update the trigger function to capture first_name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', '')
  );
  RETURN new;
END;
$$;