import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tumduktimwlfnxhtyeax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bWR1a3RpbXdsZm54aHR5ZWF4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUzODkwNywiZXhwIjoyMDg5MTE0OTA3fQ.DkjQmwZYeTPneNVsssKhrQg2hOcEyv8_Yc6JZyQvPW4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
    console.log('Creating habit_completions table...');
    
    const { error } = await supabase.rpc('exec_sql', {
        query: ''
    }).catch(() => ({ error: 'rpc not available' }));

    // Use the REST API to run SQL directly
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
        },
    });

    // Since we can't run DDL via JS client directly, use the management API
    const sqlRes = await fetch(`${supabaseUrl}/pg/query`, {
        method: 'POST',
        headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            query: `
                CREATE TABLE IF NOT EXISTS public.habit_completions (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
                    completed_date DATE NOT NULL,
                    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(habit_id, completed_date)
                );
                ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow All Public' AND tablename = 'habit_completions') THEN
                        CREATE POLICY "Allow All Public" ON public.habit_completions FOR ALL USING (true);
                    END IF;
                END $$;
            `
        })
    });

    if (sqlRes.ok) {
        console.log('Table created successfully!');
    } else {
        console.log('Could not create table via API. Status:', sqlRes.status);
        console.log('');
        console.log('=== PLEASE RUN THIS SQL IN YOUR SUPABASE SQL EDITOR ===');
        console.log('');
        console.log(`CREATE TABLE IF NOT EXISTS public.habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(habit_id, completed_date)
);

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow All Public" ON public.habit_completions FOR ALL USING (true);`);
        console.log('');
        console.log('=== END SQL ===');
    }
}

createTable();
