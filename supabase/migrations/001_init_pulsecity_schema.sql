-- PulseCity Initial Schema Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'staff', 'admin')),
  department text,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

-- Create issues table
CREATE TABLE public.issues (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('pothole', 'flood', 'fixed_road', 'water', 'electricity', 'school')),
  lat numeric(10, 8) NOT NULL,
  lng numeric(11, 8) NOT NULL,
  city text DEFAULT 'Abuja',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'verified', 'assigned', 'in-progress', 'completed')),
  photo_url text,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_staff_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  votes_up integer DEFAULT 0,
  votes_down integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

-- Create votes table
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  voter_fingerprint uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at timestamp with time zone DEFAULT NOW(),
  UNIQUE(issue_id, voter_fingerprint)
);

-- Create comments table
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamp with time zone DEFAULT NOW()
);

-- Create status_history table
CREATE TABLE public.status_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id uuid NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('open', 'verified', 'assigned', 'in-progress', 'completed')),
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at timestamp with time zone DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  issue_id uuid REFERENCES public.issues(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('assigned', 'status_update', 'comment', 'vote', 'verification')),
  title text NOT NULL,
  message text,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_issues_user_id ON public.issues(user_id);
CREATE INDEX idx_issues_category ON public.issues(category);
CREATE INDEX idx_issues_status ON public.issues(status);
CREATE INDEX idx_issues_assigned_staff_id ON public.issues(assigned_staff_id);
CREATE INDEX idx_issues_city ON public.issues(city);
CREATE INDEX idx_issues_created_at ON public.issues(created_at);
CREATE INDEX idx_votes_issue_id ON public.votes(issue_id);
CREATE INDEX idx_votes_voter_fingerprint ON public.votes(voter_fingerprint);
CREATE INDEX idx_comments_issue_id ON public.comments(issue_id);
CREATE INDEX idx_status_history_issue_id ON public.status_history(issue_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_issue_id ON public.notifications(issue_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for issues
CREATE POLICY "Anyone can view issues"
  ON public.issues FOR SELECT
  USING (true);

CREATE POLICY "Citizens can create issues"
  ON public.issues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Issue creator or staff can update issues"
  ON public.issues FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('staff', 'admin'))
  );

-- RLS Policies for votes
CREATE POLICY "Anyone can view votes"
  ON public.votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.votes FOR INSERT
  WITH CHECK (auth.uid() = voter_fingerprint);

-- RLS Policies for comments
CREATE POLICY "Anyone can view comments"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = COALESCE(user_id, auth.uid()));

-- RLS Policies for status_history
CREATE POLICY "Anyone can view status history"
  ON public.status_history FOR SELECT
  USING (true);

CREATE POLICY "Staff can update status"
  ON public.status_history FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('staff', 'admin'))
  );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create storage bucket for issue photos
-- Note: This must be done manually in Supabase dashboard or via separate storage setup
-- Bucket name: issue-photos (public)

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'citizen');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update votes count when vote is created
CREATE OR REPLACE FUNCTION public.update_issue_votes()
RETURNS trigger AS $$
BEGIN
  IF NEW.vote_type = 'up' THEN
    UPDATE public.issues SET votes_up = votes_up + 1 WHERE id = NEW.issue_id;
  ELSIF NEW.vote_type = 'down' THEN
    UPDATE public.issues SET votes_down = votes_down + 1 WHERE id = NEW.issue_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update votes count
CREATE TRIGGER on_vote_created
  AFTER INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.update_issue_votes();

-- Function to update issue timestamp on changes
CREATE OR REPLACE FUNCTION public.update_issue_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update issue timestamp
CREATE TRIGGER on_issue_updated
  BEFORE UPDATE ON public.issues
  FOR EACH ROW EXECUTE FUNCTION public.update_issue_timestamp();
