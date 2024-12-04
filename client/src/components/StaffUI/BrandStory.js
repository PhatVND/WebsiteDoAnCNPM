import React from "react";
import "../css/BrandStory.css";

const BrandStory = () => {
  return (
    /* Brand Story Content */
    <div className="edited-content row align-items-center">
      <div className="col-md-7 mb-4">
        <img
          src="../image/banner.png"
          alt="JOHAP BANNER"
          style={{ width: '75%', height: 'auto', display: 'block', margin: '50px' }}
        />
      </div>
      <div className="col-md-5 mb-4" style={{ textAlign: 'left' }}>
        <p style={{ fontWeight: 'bold', fontSize: '1.5rem' }}>The JoHap Story</p>
        <p>
          <strong>JoHap</strong> was founded in 2024 to provide convenience and speed for students at Bach Khoa University in ordering food from the canteen. <strong>JoHap</strong> stands for "Joy and Happiness", inspired by the team's spirit when creating the project. <strong>JoHap</strong> captures the essence of nature in every dish, bringing a fresh and comforting experience. With <strong>JoHap</strong>, each meal is a commitment to health and joy from nature, along with convenience, allowing you to enjoy every moment of your day fully.
        </p>
      </div>
    </div>
  );
};

export default BrandStory;