'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(distance, duration, coords) {
    this.distance = distance;
    this.duration = duration;
    this.coords = coords;
  }
}
class Running extends Workout {
  type = 'running';
  constructor(distance, duration, coords, cadence) {
    super(distance, duration, coords);
    this.cadence = cadence;
    this._calcPace();
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} at ${
      months[this.date.getMonth()]
    } ${this.date.getDay()}`;
  }
  _calcPace() {
    this.pace = (this.duration / this.distance).toFixed(1);
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(distance, duration, coords, elevationGain) {
    super(distance, duration, coords);
    this.elevationGain = elevationGain;
    this._speed();
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} at ${
      months[this.date.getMonth()]
    } ${this.date.getDay()}`;
  }
  _speed() {
    this.speed = (this.distance / (this.duration / 60)).toFixed(1);
  }
}
class App {
  #marker;
  #map;
  #workout = [];
  #zoomLvl = 13;
  constructor() {
    this._getPosition();
    this._getLocalStorage();
    form.addEventListener('submit', this._newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert("It wasn't possible to get your location");
      }
    );
  }
  _loadMap(e) {
    const { latitude, longitude } = e.coords;
    this.#map = L.map('map').setView([latitude, longitude], this.#zoomLvl);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    this.#workout.forEach(el => {
      this._renderWorkoutMarker(el);
    });
  }
  _showForm(e) {
    this.#marker = e;
    form.classList.remove('hidden');
    inputDistance.focus();
    inputType.addEventListener('change', this._toggleElevationField);
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputDistance.focus();
  }
  _newWorkout(e) {
    e.preventDefault;
    form.classList.add('hidden');
    const { lat, lng } = this.#marker.latlng;
    const checkNum = (...inp) => inp.every(input => Number.isFinite(input));
    const checkPos = (...inp) => inp.every(input => input > 0);
    const clearFields = function () {
      inputCadence.value =
        inputDistance.value =
        inputDuration.value =
        inputElevation.value =
          '';
    };
    let workout;
    //get values
    const type = inputType.value;
    const duration = +inputDuration.value;
    const distance = +inputDistance.value;
    //see if cycling
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      //see if it's right
      if (!checkNum(duration, distance, elevation)) {
        clearFields();
        return alert('please write a number');
      }
      if (!checkPos(duration, distance)) {
        clearFields();
        return alert('please write a positive number');
      }
      workout = new Cycling(distance, duration, [lat, lng], elevation);
      this._renderWorkoutMarker(workout);
    }

    //see if running
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //see if it's right
      if (!checkNum(duration, distance, cadence)) {
        clearFields();
        return alert('please write a number');
      }
      if (!checkPos(duration, distance, cadence)) {
        clearFields();
        return alert('please write a positive number');
      }
      workout = new Running(distance, duration, [lat, lng], cadence);
      this._renderWorkoutMarker(workout);
    }
    //Update List
    this._renderWorkout(workout);
    this.#workout.push(workout);
    //set LocalStorage
    this._setLocalStorage();
    //clear forms
    clearFields();
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
        </div>`;
    if (workout.type === 'running') {
      html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.pace}</span>
                <span class="workout__unit">spm</span>
            </div>
            </li>
            `;
      form.insertAdjacentHTML('afterend', html);
    }
    if (workout.type === 'cycling') {
      html += `
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
        `;
      form.insertAdjacentHTML('afterend', html);
    }
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.description}`)
      .openPopup();
  }
  _moveToPopup(e) {
    const clicked = e.target.closest('.workout');
    if (!clicked) return;
    const workoutEl = this.#workout.find(work => work.id == clicked.dataset.id);
    console.log(workoutEl);
    this.#map.setView(workoutEl.coords, this.#zoomLvl);
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workout = data;
    this.#workout.forEach(el => {
      this._renderWorkout(el);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
  }
}
const app = new App();
