import React, { useState, useEffect } from 'react';
import './Placescard.css'
import axios from 'axios';

const Placescard = ({ data }) => {

  const {
    name,
    street1,
    street2,
    city,
    country,
    latitude,
    longitude,
    images,
    price,
    numofrank,
    rating
  } = data;

  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const fetchRandomImage = async () => {
      try {
        const response = await axios.get(' https://source.unsplash.com/400x300/?hotels');
        setImageUrl(response.request.responseURL);
      } catch (error) {
        console.error('Error fetching random image:', error);
      }
    };
    if (!images) {
      fetchRandomImage();
    } else {
      setImageUrl(images.images.small.url);
    }
  }, [images]);

  return (
    <div className='card'>
      <img src={imageUrl} alt="" className='cardimg' />
      <div className="card-content">
        <h3 style={{ fontWeight: 700 }}>{name}</h3>
        {rating ? (
          <p>{rating}⭐</p>) : (
          <p></p>
        )}
        <p style={{ color: "gray" }}>
          {street1}
          {street2 && `, ${street2}`}
        </p>
        <p style={{ color: "gray" }}>
          {city}, {country}
        </p>
        {price ? (<p style={{ fontWeight: 600 }}>Price starts from {price}</p>) : (<p></p>)}
      </div>
    </div>
  )
}

export default Placescard