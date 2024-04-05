// Inicializar el mapa
var map = L.map("map").setView([-34.7282101, -58.3783931], 12);

// Agregar capa base
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
}).addTo(map);

// Crear un grupo de capas para los marcadores
var markers = L.layerGroup().addTo(map);

//Icon para el marcador
var skullIcon = L.icon({
  iconUrl: "../images/dead.png",
  iconSize: [32, 32], // Tamaño del icono [ancho, alto]
});

var lightIcon = L.icon({
  iconUrl: "../images/light.png",
  iconSize: [32, 32], // Tamaño del icono [ancho, alto]
});

var otherIcon = L.icon({
  iconUrl: "../images/other.png",
  iconSize: [32, 32], // Tamaño del icono [ancho, alto]
});

var dangerIcon = L.icon({
  iconUrl: "../images/danger.png",
  iconSize: [32, 32], // Tamaño del icono [ancho, alto]
});

var foodIcon = L.icon({
  iconUrl: "../images/food.png",
  iconSize: [32, 32], // Tamaño del icono [ancho, alto]
});

//funcion para agregar un marcador al mapa
function addMarkerToMap(latlng, popupContent, category) {
  let icon;
  if (category === "Inseguridad") {
    icon = skullIcon;
  } else if (category === "Peligro") {
    icon = dangerIcon;
  } else if (category === "Electricidad") {
    icon = lightIcon;
  } else if (category === "Comidas") {
    icon = foodIcon;
  } else if (category === "Otros") {
    icon = otherIcon;
  }
  let newMarker = L.marker(latlng, { icon: icon }).addTo(markers);
  newMarker.bindPopup(popupContent);
}

//funcion para obtener los marcadores del backend y mostrarlo
function fetchAndShowMarkers() {
  fetch("https://chucherias-map-server-one.vercel.app/marks")
    .then((response) => response.json())
    .then((marks) => {
      marks.forEach((mark) => {
        var latlng = { lat: mark.lat, lng: mark.lng };
        var popupContent = mark.popupContent;
        let category = mark.category;
        addMarkerToMap(latlng, popupContent, category);
      });
    })
    .catch((error) => console.log(error));
}

fetchAndShowMarkers();

// Función para agregar marcador al hacer clic en el mapa
function onMapClick(e) {
  var newMarker = L.marker(e.latlng).addTo(markers);
  newMarker.bindPopup(createPopupForm(newMarker)).openPopup();
}

// Crear formulario para el popup
function createPopupForm(marker) {
  var form = "<h3 class='popup-title'>Información del Marcador</h3>";
  form += '<form onsubmit="saveMarkerInfo(event, ' + L.stamp(marker) + ')">';
  form += '<input class="form-popup-input" placeholder="Titulo" type="text" name="title" required><br>';
  form +=
    '<br><textarea placeholder="Descripcion" name="description" rows="4" required maxlength="100"></textarea><br>';
  form +=
    'Categoría:<select class="form-popup-input" name="category"><option value="Electricidad">Electricidad</option><option value="Peligro">Peligro</option><option value="Comidas">Comidas</option><option value="Inseguridad">Inseguridad</option><option value="Otros">Otros</option></select><br>';
  form += '<div class="form-popup-buttons"><input class="popup-button save-button" type="submit" value="Guardar"><button class="popup-button delete-mark" onclick="deleteMarker(' +
  L.stamp(marker) +
  ')">Eliminar Marcador</button></div>';
  form += "</form>";
  return form;
}

// Función para guardar la información del marcador
function saveMarkerInfo(event, markerId) {
  event.preventDefault();
  var marker = markers.getLayer(markerId);
  let title = event.target.title.value;
  let category = event.target.category.value;
  let description = event.target.description.value;
  let idMark = markerId

  let data = {
    idMark:idMark,
    title: title,
    category: category,
    lat: marker.getLatLng().lat,
    lng: marker.getLatLng().lng,
    popupContent:
      "<h3 class='popup-title'>" +
      title +
      "</h3><p><strong>Categoría:</strong> " +
      category +
      "</p><p><strong>Descripción:</strong> " +
      description +
      "</p><button class='popup-button-delete delete-mark' onclick=deleteMarkFromDB(" + markerId + ")>Eliminar</button>",
  };

  fetch("https://chucherias-map-server-one.vercel.app/marks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error("Error al guardar el marcador");
    })
    .then((savedMarker) => {
      deleteMarker(idMark)
      addMarkerToMap(
        { lat: savedMarker.lat, lng: savedMarker.lng },
        savedMarker.popupContent,
        savedMarker.category
      );
    })
    .catch((error) => console.log(error));
}

function deleteMarkFromDB(mark_id){
    fetch(`https://chucherias-map-server-one.vercel.app/marks/${mark_id}`,{
        method:"DELETE"
    })
    .then(response => {
        if(response.ok){
            Swal.fire({
                title: "¿Estas seguro?",
                text: "La marca se eliminara completamente",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Si",
              }).then((result) => {
                if (result.isConfirmed) {
                  Swal.fire({
                    title: "Eliminado!",
                    text: "Marca eliminada exitosamente.",
                    icon: "success"
                  });
                  markers.clearLayers();
            fetchAndShowMarkers()
                }
              });
        }else{
            console.log("Error al eliminar la marca")
        }
    })
    .catch(error => console.log(error))
}

// Función para eliminar un marcador
function deleteMarker(markerId) {
  markers.eachLayer(function (layer) {
    if (L.stamp(layer) === markerId) {
      markers.removeLayer(layer);
    }
  });
}

// Obtener todas las imágenes de las categorías
var categoryImages = document.querySelectorAll('.icon-mark');

// Agregar un controlador de eventos a cada imagen
categoryImages.forEach(function(image) {
    image.addEventListener('click', function(event) {
        // Obtener la categoría de la imagen
        var category = event.target.alt.split(' ')[0]; // Tomar la primera palabra de la descripción de la imagen

        // Eliminar todas las marcas del mapa
        markers.clearLayers();

        // Filtrar y mostrar solo las marcas de la categoría seleccionada
        fetch("https://chucherias-map-server-one.vercel.app/marks")
            .then((response) => response.json())
            .then((marks) => {
                if(category === "Todos"){
                    fetchAndShowMarkers()
                }else{
                    marks.forEach((mark) => {
                        if (mark.category === category) {
                            var latlng = { lat: mark.lat, lng: mark.lng };
                            var popupContent = mark.popupContent;
                            addMarkerToMap(latlng, popupContent, category);
                        }
                    });
                }
            })
            .catch((error) => console.log(error));
    });
});

document.getElementById('city-search').addEventListener('input', function() {
  var searchInput = this.value.trim();
  if (searchInput.length > 0) {
      searchCities(searchInput);
  } else {
      clearSearchResults();
  }
});

document.addEventListener('click', function(event) {
  var searchResultsContainer = document.getElementById('search-results');
  var isClickInsideContainer = searchResultsContainer.contains(event.target);

  if (!isClickInsideContainer) {
      clearSearchResults();
  }
});

function searchCities(searchInput) {
  fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchInput}`)
      .then(response => response.json())
      .then(data => {
          var searchResultsContainer = document.getElementById('search-results');
          searchResultsContainer.innerHTML = ''; // Limpiar los resultados anteriores

          if (data && data.length > 0) {
              data.forEach(city => {
                  var cityName = city.display_name;
                  var cityElement = document.createElement('div');
                  cityElement.textContent = cityName;
                  cityElement.classList.add('search-result-item');
                  cityElement.addEventListener('click', function() {
                      var lat = parseFloat(city.lat);
                      var lon = parseFloat(city.lon);
                      map.setView([lat, lon], 12); // Ajusta la vista del mapa a la ubicación de la ciudad
                      clearSearchResults(); // Limpiar los resultados después de seleccionar una ciudad
                  });
                  searchResultsContainer.appendChild(cityElement);
              });
          } else {
              var noResultsMessage = document.createElement('div');
              noResultsMessage.textContent = 'No se encontraron ciudades.';
              searchResultsContainer.appendChild(noResultsMessage);
          }
      })
      .catch(error => {
          console.error('Error al buscar las ciudades:', error);
      });
}

function clearSearchResults() {
  var searchResultsContainer = document.getElementById('search-results');
  searchResultsContainer.innerHTML = '';
}
// Agregar evento de clic al mapa
map.on("click", onMapClick);
