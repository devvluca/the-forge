import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tumduktimwlfnxhtyeax.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1bWR1a3RpbXdsZm54aHR5ZWF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1Mzg5MDcsImV4cCI6MjA4OTExNDkwN30.eY-4Vi7FQIZjzr8a5SnmmMCmDuiRp0wbAAfh7DLCLqY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Clearing existing habits...');
    await supabase.from('habits').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Inserting new habits...');
    const newHabits = [
        { name: '20min de violão', streak: 0 },
        { name: '20min de leitura bíblica', streak: 0 },
        { name: '4L de água', streak: 0 },
        { name: 'Ver aulas da pós-graduação', streak: 0 },
        { name: 'Treino Físico Intenso', streak: 0 },
        { name: 'Oração', streak: 0 },
        { name: 'Jejum Mínimo', streak: 0 }
    ];

    const { data, error } = await supabase.from('habits').insert(newHabits).select();
    if (error) {
        console.error('Error seeding data:', error);
    } else {
        console.log('Successfully inserted habits:', data.length);
    }
}

seed();
