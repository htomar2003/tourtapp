import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import "react-datepicker/dist/react-datepicker.css";
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import L from 'leaflet';
import axios from 'axios'
import Placescard from './Components/Placescard.js'
import 'leaflet-control-geocoder';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [popularPlaces, setPopularPlaces] = useState([]);
  const [distance, setDistance] = useState(0.5);
  const [latitude, setLatitude] = useState(51.505); 
  const [longitude, setLongitude] = useState(-0.09);
  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [hideSuggestions, setHideSuggestions] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [originaldata, setoriginaldata] = useState([]);
  const [isOpenNow, setIsOpenNow] = useState(false);
  const mapRef = useRef(null);

  const apiKey = process.env.REACT_APP_APIKEY;

  const fetchNearbyPlaces = async (latitude, longitude) => {
    const options = {
      method: 'GET',
      url: 'https://travel-advisor.p.rapidapi.com/restaurants/list-by-latlng',
      params: {
        latitude: latitude,
        longitude: longitude,
        limit: '30',
        currency: 'INR',
        distance: distance.toString(),
        open_now: 'false',
        lunit: 'km',
        lang: 'en_US'
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
      }
    };

    try {
      const response = await axios.request(options);
      const data = response.data.data;
      console.log(data);
      const filteredPlaces = data.filter((place) => place.name);
      setPopularPlaces(filteredPlaces);
      setoriginaldata(filteredPlaces);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const map = L.map('map').setView([12.9236, 100.8825], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    mapRef.current = map;
    L.Control.geocoder().addTo(map);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLatitude(latitude);
          setLongitude(longitude);
          map.setView([latitude, longitude], 13);
          fetchNearbyPlaces(latitude, longitude);
        },
        (error) => {
          console.error('Error getting user location:', error);
          fetchNearbyPlaces(51.505, -0.09);
        }
      );
    } else {
      console.log("Hello")
      fetchNearbyPlaces(51.505, -0.09);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && popularPlaces.length > 0) {
      const map = mapRef.current;
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });
      popularPlaces.forEach((place) => {
        const defaultLatitude = 0;
        const defaultLongitude = 0;
        const { latitude, longitude } = place;
        const finalLatitude = latitude !== undefined ? latitude : defaultLatitude;
        const finalLongitude = longitude !== undefined ? longitude : defaultLongitude;
        L.marker([finalLatitude, finalLongitude]).addTo(map);
      });
    }
  }, [isLoading, popularPlaces]);


  const fetchAutoCompleteSuggestions = async (query) => {
    const options = {
      method: 'GET',
      url: 'https://travel-advisor.p.rapidapi.com/locations/v2/auto-complete',
      params: {
        query: query,
        lang: 'en_US',
        units: 'km'
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
      }
    };

    try {
      const response = await axios.request(options);
      setSuggestions(response.data.data.Typeahead_autocomplete.results);
    } catch (error) {
      console.error(error);
    }
  };

  const callApi = async (query) => {
    const options = {
      method: 'GET',
      url: 'https://travel-advisor.p.rapidapi.com/locations/search',
      params: {
        query: query,
        limit: '30',
        offset: '0',
        units: 'km',
        location_id: '1',
        currency: 'USD',
        sort: 'relevance',
        lang: 'en_US'
      },
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'travel-advisor.p.rapidapi.com'
      }
    };

    try {
      const response = await axios.request(options);
      const data = response.data.data;
      const resultObjectsArray = data.map((item) => item.result_object);
      const filteredPlaces = resultObjectsArray.filter((place) => place.name);
      console.log(filteredPlaces);
      setPopularPlaces(filteredPlaces);
      setoriginaldata(filteredPlaces);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
    }
  };


  const handleInputChange = (event) => {
    setPopularPlaces([]);
    const inputValue = event.target.value;
    setSearchText(inputValue);
    setHideSuggestions(false);
    fetchAutoCompleteSuggestions(inputValue);
    callApi(inputValue);
  };

  const handleSliderChange = (event, newValue) => {
    setDistance(newValue);
    setIsLoading(true);
    fetchNearbyPlaces(latitude, longitude);
  };

  const handleSuggestionClick = (suggestionText) => {
    setSearchText(suggestionText); 
    setHideSuggestions(true); 
  };

  const handleDropdownClick = (attrcationtext) => {
    var filteredPlaces = [];
    if (attrcationtext === '') {
      filteredPlaces = originaldata;
    } else {
      filteredPlaces = originaldata.filter((place) => place.category.name === attrcationtext);
    }
    setPopularPlaces(filteredPlaces);
  }

  const toggleDropdown = () => {
    setDropdownVisible((prevState) => !prevState);
  };

  const handleopennow = () => {
    if (!isOpenNow) {
      const filteredPlaces = originaldata.filter((place) => place.open_now_text);
      setPopularPlaces(filteredPlaces);
    } else {
      setPopularPlaces(originaldata);
    }
    setIsOpenNow(!isOpenNow);
  }

  const PrettoSlider = styled(Slider)({
    color: '#52af77',
    height: 8,
    '& .MuiSlider-track': {
      border: 'none',
    },
    '& .MuiSlider-thumb': {
      height: 24,
      width: 5,
      backgroundColor: '#52af77',
      borderRadius: "2px",
      border: '2px solid currentColor',
      '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
        boxShadow: 'inherit',
      },
      '&:before': {
        display: 'none',
      },
    },
    '& .MuiSlider-valueLabel': {
      lineHeight: 1.2,
      fontSize: 12,
      background: 'unset',
      padding: 0,
      width: 32,
      height: 32,
      borderRadius: '50% 50% 50% 0',
      backgroundColor: '#52af77',
      transformOrigin: 'bottom left',
      transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
      '&:before': { display: 'none' },
      '&.MuiSlider-valueLabelOpen': {
        transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
      },
      '& > *': {
        transform: 'rotate(45deg)',
      },
    },
  });


  return (
    <div className="App">
      <div className="appbar">
        <div className={isOpenNow ? 'btn btn-active' : 'btn'} onClick={handleopennow}>
          Open Now
        </div>
        <div className={`searchbox ${isInputFocused ? 'focused' : ''}`}>
          <i className="fa fa-search search-icon" aria-hidden="true"></i>
          <input
            type="text"
            name="search"
            className='search'
            id="search"
            placeholder='Where to?'
            value={searchText}
            onChange={handleInputChange}
            onBlur={async () => {
              setTimeout(() => {
                setHideSuggestions(true);
              }, 200);
            }}
            onFocus={() => setHideSuggestions(false)}
          />
          <div className={`suggestions ${hideSuggestions ? 'hidden' : ''}`}>
            {suggestions.map((suggestion) =>
              suggestion.text ? (
                <div className="suggestion" key={suggestion.documentId}
                  onClick={() => handleSuggestionClick(suggestion.text)}>
                  {suggestion.text}
                </div>
              ) : null
            )}
          </div>
        </div>
        <div className="filterbtns">
          <button className="btn">Filters</button>
          <div className="attraction">
            <button className="btn" onClick={toggleDropdown}>
              Attractions <i className="fa fa-caret-down" aria-hidden="true"></i>
            </button>
            {dropdownVisible && (
              <div id="dropdownContent" className="dropdown-content">
                <a href="#" onClick={() => handleDropdownClick('Restaurant')}>
                  Restaurant
                </a>
                <a href="#" onClick={() => handleDropdownClick('Hotel')}>
                  Hotel
                </a>
                <a href="#" onClick={() => handleDropdownClick('Geographic')}>
                  Geographic
                </a>
                <a href="#" onClick={() => handleDropdownClick('')}>
                  All
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="content">
        <div className="left">
          <div className="slider">
            <Box sx={{ width: 200 }}>
              <div className="sliderdiv">
                <span>Distance</span>
                <span>5 Km</span>
              </div>
              <PrettoSlider
                valueLabelDisplay="auto"
                aria-label="pretto slider"
                defaultValue={0.5}
                min={0}
                max={5}
                value={distance}
                onChange={handleSliderChange}
              />
            </Box>
          </div>
          <div className="places">
            {isLoading ? (
              <p style={{ width: "100%", textAlign: 'center' }}><img src="loading.gif" alt="Loading..." width={200} height={200} /></p>
            ) : popularPlaces.length > 0 ? (
              <>
                <p style={{ color: "gray" }}>
                  Total {popularPlaces.length} results
                </p>
                {popularPlaces.map((place) => (
                  <Placescard
                    key={place.location_id}
                    data={{
                      name: place.name,
                      street1: place.address_obj?.street1 || '',
                      street2: place.address_obj?.street2 || '',
                      city: place.address_obj?.city || '',
                      country: place.address_obj?.country || '',
                      latitude: place.latitude,
                      longitude: place.longitude,
                      images: place.photo,
                      price: place.price,
                      numofrank: place.ranking_denominator,
                      rating: place.rating,
                    }}
                  />
                ))}
              </>
            ) : (
              <>
                {
                  popularPlaces.length === 0 ? (
                    <p>No Data Found</p>
                  ) : (
                    <p>Loading...</p>
                  )
                }
              </>
            )}
          </div>
        </div>
        <div className="right">
          <div id="map" style={{ height: '100vh', width: "100%" }}></div>
        </div>
      </div>
    </div>
  );
}

export default App;
