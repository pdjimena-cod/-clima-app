const API_KEY = '6d443eae6cdb6a389f347fd3398d3da3';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
const API_FORECAST = 'https://api.openweathermap.org/data/2.5/forecast';

const formulario = document.getElementById('formulario');
const inputCiudad = document.getElementById('inputCiudad');
const resultado = document.getElementById('resultado');
const estado = document.getElementById('estado');
const btnUbicacion = document.getElementById('btnUbicacion');
const btnModo = document.getElementById('btnModo');
const btnCompartir = document.getElementById('btnCompartir');
const pronosticoDiv = document.getElementById('pronostico');
const historialDiv = document.getElementById('historial');

let ultimoClima = null; // Para reto 5

async function consultarClima(ciudad) {
    estado.textContent = ' Consultando el clima...';
    resultado.classList.remove('visible');
    pronosticoDiv.style.display = 'none';

    try {
        const ciudadCodificada = encodeURIComponent(ciudad);
        const url = `${API_URL}?q=${ciudadCodificada}&appid=${API_KEY}&units=metric&lang=es`;
        const respuesta = await fetch(url);

        if (!respuesta.ok) {
            if (respuesta.status === 404) throw new Error('Ciudad no encontrada');
            if (respuesta.status === 401) throw new Error('API Key inválida');
            throw new Error('Error: ' + respuesta.status);
        }
        const datos = await respuesta.json();
        mostrarClima(datos);
        consultarPronostico(ciudad); // RETO 2
        guardarHistorial(datos.name); // RETO 3
        estado.textContent = ' Datos actualizados correctamente.';
    } catch (error) {
        estado.textContent = ` ${error.message}. Intenta con otra ciudad.`;
    }
}

function mostrarClima(datos) {
    ultimoClima = datos; // Guardamos para compartir
    const temp = Math.round(datos.main.temp);
    const descripcion = datos.weather[0].description;
    const humedad = datos.main.humidity;
    const viento = datos.wind.speed;
    const icono = datos.weather[0].icon;
    const pais = datos.sys.country;

    resultado.innerHTML = `
        <div class="ciudad">${datos.name}</div>
        <div class="pais">${pais}</div>
        <img class="icono-clima" src="https://openweathermap.org/img/wn/${icono}@4x.png">
        <div class="temperatura">${temp}°C</div>
        <div class="descripcion">${descripcion}</div>
        <div class="detalles">
            <div class="detalle"><div class="etiqueta">Humedad</div><div class="valor">${humedad}%</div></div>
            <div class="detalle"><div class="etiqueta">Viento</div><div class="valor">${viento} m/s</div></div>
        </div>
    `;
    resultado.classList.add('visible');
    btnCompartir.style.display = 'inline-block';
    cambiarFondoSegunClima(datos.weather[0].main);
}

function cambiarFondoSegunClima(clima) {
    document.body.classList.remove('clima-soleado', 'clima-nublado', 'clima-lluvioso', 'clima-nieve');
    const c = clima.toLowerCase();
    if (c.includes('clear')) document.body.classList.add('clima-soleado');
    else if (c.includes('cloud')) document.body.classList.add('clima-nublado');
    else if (c.includes('rain') || c.includes('drizzle') || c.includes('thunderstorm')) document.body.classList.add('clima-lluvioso');
    else if (c.includes('snow')) document.body.classList.add('clima-nieve');
}

// === RETO 1: GEOLOCALIZACIÓN ===
btnUbicacion.addEventListener('click', () => {
    if (!navigator.geolocation) {
        estado.textContent = ' Tu navegador no soporta geolocalización';
        return;
    }
    estado.textContent = ' Obteniendo tu ubicación...';
    navigator.geolocation.getCurrentPosition(async (posicion) => {
        const lat = posicion.coords.latitude;
        const lon = posicion.coords.longitude;
        const url = `${API_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;
        const res = await fetch(url);
        const datos = await res.json();
        mostrarClima(datos);
        consultarPronosticoPorCoords(lat, lon);
        estado.textContent = ' Ubicación obtenida';
    }, () => {
        estado.textContent = ' No se pudo obtener la ubicación';
    });
});

// === RETO 2: PRONÓSTICO 5 DÍAS ===
async function consultarPronostico(ciudad) {
    const url = `${API_FORECAST}?q=${encodeURIComponent(ciudad)}&appid=${API_KEY}&units=metric&lang=es`;
    const res = await fetch(url);
    const datos = await res.json();
    mostrarPronostico(datos);
}
async function consultarPronosticoPorCoords(lat, lon) {
    const url = `${API_FORECAST}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;
    const res = await fetch(url);
    const datos = await res.json();
    mostrarPronostico(datos);
}
function mostrarPronostico(datos) {
    // Filtramos 1 por día a las 12:00
    const porDia = datos.list.filter(item => item.dt_txt.includes('12:00:00')).slice(0,5);
    pronosticoDiv.style.display = 'block';
    pronosticoDiv.classList.add('visible');
    pronosticoDiv.innerHTML = `<h3>Pronóstico 5 días</h3><div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:15px;">
    ${porDia.map(d => `
        <div class="detalle">
            <div class="etiqueta">${new Date(d.dt*1000).toLocaleDateString('es-ES', {weekday:'short'})}</div>
            <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}.png">
            <div class="valor">${Math.round(d.main.temp)}°C</div>
        </div>
    `).join('')}
    </div>`;
}

// === RETO 3: HISTORIAL ===
function guardarHistorial(ciudad) {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    if (!historial.includes(ciudad)) {
        historial.unshift(ciudad);
        historial = historial.slice(0,5); // solo 5
        localStorage.setItem('historial', JSON.stringify(historial));
    }
    mostrarHistorial();
}
function mostrarHistorial() {
    let historial = JSON.parse(localStorage.getItem('historial')) || [];
    if (historial.length === 0) return;
    historialDiv.innerHTML = 'Historial: ' + historial.map(c => `<button onclick="consultarClima('${c}')" style="padding:5px 10px; font-size:0.8rem; margin:3px;">${c}</button>`).join('');
}

// === RETO 4: MODO CLARO / OSCURO ===
btnModo.addEventListener('click', () => {
    document.body.classList.toggle('modo-claro');
    if (document.body.classList.contains('modo-claro')) {
        document.body.style.background = '#f0f0f0';
        document.body.style.color = '#333';
    } else {
        document.body.style.background = '';
        document.body.style.color = '';
    }
});

// === RETO 5: COMPARTIR WHATSAPP ===
btnCompartir.addEventListener('click', () => {
    if (!ultimoClima) return;
    const texto = `El clima en ${ultimoClima.name} es ${Math.round(ultimoClima.main.temp)}°C con ${ultimoClima.weather[0].description} 🌤️ ¡Consúltalo aquí!`;
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
});

// Eventos principales
formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    const ciudad = inputCiudad.value.trim();
    if (!ciudad) { estado.textContent = ' Escribe el nombre de una ciudad.'; return; }
    consultarClima(ciudad);
});

estado.textContent = 'Escribe una ciudad y presiona "Consultar".';
mostrarHistorial();
