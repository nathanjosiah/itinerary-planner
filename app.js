let map;
let directionsService;
let directionsRenderer;

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 10,
        center: { lat: -34.397, lng: 150.644 }
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });
    directionsRenderer.setMap(map);

    loadFromURL();
}

function addAddress(label = '', address = '', duration = '') {
    const addressList = document.getElementById('address-list');
    const newAddress = document.createElement('div');
    newAddress.innerHTML = `
                <input type="text" value="${label}" placeholder="Label" class="label">
                <input type="text" value="${address}" placeholder="Address" class="address">
                <input type="number" value="${duration}" placeholder="Duration (min)" class="duration">
            `;
    addressList.appendChild(newAddress);
}

function plotRoute() {
    if (!directionsService || !directionsRenderer) {
        console.error('DirectionsService or DirectionsRenderer is not initialized.');
        return;
    }

    const labels = Array.from(document.getElementsByClassName('label')).map(el => el.value);
    const addresses = Array.from(document.getElementsByClassName('address')).map(el => el.value);
    const lengthsAtLocation = Array.from(document.getElementsByClassName('duration')).map(el => el.value);
    const startTime = document.getElementById('start-time').value;

    const waypoints = addresses.slice(1, -1).map((address) => ({
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
        if (status === 'OK') {
            directionsRenderer.setDirections(result);

            // Add a static test marker after directions are rendered
            const testMarker = new google.maps.Marker({
                position: result.routes[0].legs[0].start_location,
                map: map,
                title: 'Static Test Marker'
            });

            // Proceed with adding dynamic markers
            addMarkers(result, labels, startTime, lengthsAtLocation);
            generateSharableURL();
        } else {
            console.error('Error:', status);
        }
    });
}

function addMarker(map, location, label, address, arrivalTime, lengthAtLocation, departureTime, infoWindow) {
    const marker = new google.maps.Marker({
        position: location,
        map: map,
        title: label
    });

    const contentString = `
        <div>
            <h4>${label}</h4>
            <p>Address: ${address}</p>
            <p>Arrival Time: ${arrivalTime}</p>
            <p>Length at location: ${lengthAtLocation} mins</p>
            <p>Departure Time: ${departureTime}</p>
        </div>
    `;

    marker.addListener('click', () => {
        infoWindow.setContent(contentString);
        infoWindow.open(map, marker);
    });
}

function addMarkers(result, labels, startTime, lengthsAtLocation) {
    const route = result.routes[0];
    const legTimes = route.legs.map(leg => leg.duration.value / 60); // convert to minutes
    let currentTime = new Date(startTime);
    let departureTime = new Date(currentTime.getTime() + legTimes[0] + lengthsAtLocation[0] * 60000);
    const infoWindow = new google.maps.InfoWindow();
    let lastLeg = null;
    
    route.legs.forEach((leg, i) => {
        departureTime = new Date(currentTime.getTime() + lengthsAtLocation[i] * 60000);
        addMarker(
            map,
            leg.start_location, 
            labels[i], 
            leg.start_address,
            currentTime.toLocaleString(),
            lengthsAtLocation[i], 
            departureTime.toLocaleString(), 
            infoWindow
        );
        currentTime = new Date(departureTime.getTime() + legTimes[i] * 60000);
        lastLeg = leg;
    });

    departureTime = new Date(currentTime.getTime() + lengthsAtLocation[lengthsAtLocation.length - 1] * 60000);
    addMarker(
        map,
        lastLeg.end_location, 
        labels[labels.length - 1], 
        lastLeg.end_address,
        currentTime.toLocaleString(),
        lengthsAtLocation[lengthsAtLocation.length - 1], 
        departureTime.toLocaleString(), 
        infoWindow
    );
    
}

function generateSharableURL() {
    const labels = Array.from(document.getElementsByClassName('label')).map(el => el.value);
    const addresses = Array.from(document.getElementsByClassName('address')).map(el => el.value);
    const durations = Array.from(document.getElementsByClassName('duration')).map(el => el.value);
    const startTime = document.getElementById('start-time').value;

    const urlParams = new URLSearchParams();
    urlParams.set('labels', JSON.stringify(labels));
    urlParams.set('addresses', JSON.stringify(addresses));
    urlParams.set('durations', JSON.stringify(durations));
    urlParams.set('startTime', startTime);

    const sharableURL = `${window.location.origin}${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState(null, '', sharableURL);
}

function loadFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const labels = JSON.parse(urlParams.get('labels') || '[]');
    const addresses = JSON.parse(urlParams.get('addresses') || '[]');
    const durations = JSON.parse(urlParams.get('durations') || '[]');
    const startTime = urlParams.get('startTime');

    if (labels.length && addresses.length && durations.length && startTime) {
        document.getElementById('start-time').value = startTime;

        const addressList = document.getElementById('address-list');
        labels.forEach((label, i) => {
            addAddress(label, addresses[i], durations[i]);
        });

        plotRoute();
    }
}

window.initMap = initMap;