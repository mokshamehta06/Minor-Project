try {
    fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=28.6139&lon=77.2090')
        .then(res => res.json())
        .then(data => console.log('Fetch working:', data.address ? 'Yes' : 'No'))
        .catch(err => console.error('Fetch error:', err));
} catch (e) {
    console.error('Fetch not supported:', e.message);
}
