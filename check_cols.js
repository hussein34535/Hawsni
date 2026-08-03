const supabase = require('./hwasi_backend/config/supabase');

async function checkCols() {
    const { data, error } = await supabase.from('products').select('*').limit(1);
    if (error) {
        console.error(error);
        return;
    }
    console.log('Columns:', Object.keys(data[0]));
    console.log('Sample Data:', data[0]);
}

checkCols();
