let map;
let directionsService;
let directionsRenderer;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 10,
        center: { lat: -34.397, lng: 150.644 }
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
}

function addAddress() {
    const addressList = document.getElementById('address-list');
    const newAddress = document.createElement('div');
    newAddress.innerHTML = `
        <input type="text" placeholder="Label" class="label">
        <input type="text" placeholder="Address" class="address">
        <input type="datetime-local" class="datetime">
        <input type="number" placeholder="Duration (min)" class="duration">
    `;
    addressList.appendChild(newAddress);
}

function plotRoute() {
    const labels = Array.from(document.getElementsByClassName('label')).map(el => el.value);
    const addresses = Array.from(document.getElementsByClassName('address')).map(el => el.value);
    const datetimes = Array.from(document.getElementsByClassName('datetime')).map(el => el.value);
    const durations = Array.from(document.getElementsByClassName('duration')).map(el => el.value);

    const waypoints = addresses.slice(1, -1).map((address, index) => ({
        location: address,
        stopover: true
    }));

    const request = {
        origin: addresses[0],
        destination: addresses[addresses.length - 1],
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING
    };

    directionsService.route(request, (result, status) => {
        if (status == 'OK') {
            directionsRenderer.setDirections(result);
            calculateDurations(result, labels, datetimes, durations);
        } else {
            console.error('Error:', status);
        }
    });
}

function calculateDurations(result, labels, datetimes, durations) {
    const route = result.routes[0];
    const legTimes = route.legs.map(leg => leg.duration.value / 60); // convert to minutes

    let output = 'Route Plan:\n';
    for (let i = 0; i < labels.length; i++) {
        output += `${labels[i]}: ${datetimes[i]}\n`;
        if (i < legTimes.length) {
            const travelTime = legTimes[i];
            const duration = durations[i];
            const nextTime = new Date(new Date(datetimes[i]).getTime() + (travelTime + parseInt(duration)) * 60000);
            output += `Travel Time: ${travelTime} mins, Next Stop: ${nextTime.toLocaleString()}\n`;
        }
    }
    console.log(output);
}

window.initMap = initMap;
