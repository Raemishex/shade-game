const os = require('os');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const interfaceName in interfaces) {
        const networkInterface = interfaces[interfaceName];
        for (const address of networkInterface) {
            // IPv4 və internal (host-only) olmayan ünvanları götürürük
            if (address.family === 'IPv4' && !address.internal) {
                addresses.push(address.address);
            }
        }
    }

    return addresses;
}

const ips = getLocalIp();

console.log('\n🦊 SHADE Game — Şəbəkə Məlumatı\n');
console.log('Digər cihazlardan (telefon, digər PC) qoşulmaq üçün aşağıdakı ünvanlardan istifadə edin:\n');

if (ips.length > 0) {
    ips.forEach(ip => {
        console.log(`🔗 Frontend: http://${ip}:3000`);
        console.log(`📡 Socket:   http://${ip}:3001`);
        console.log('---------------------------');
    });
    console.log('\n💡 Qeyd: Bütün cihazlar eyni WiFi şəbəkəsinə bağlı olmalıdır.');
} else {
    console.log('❌ Yerli şəbəkə IP ünvanı tapılmadı. Şəbəkəyə bağlı olduğunuzdan əmin olun.');
}
console.log('\n');
