import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";

const NotFound = () => {
  return (
    <div className="not-found-page" style={{
      // Layering a black gradient over the image to darken it
      backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url('/assets/not-found.webp')", 
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column"
    }}>
      <Navbar />
      
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        textAlign: "center",
        padding: "0 20px"
      }}>
        {/* <h1 style={{ fontSize: "clamp(4rem, 10vw, 8rem)", margin: 0, color: "#FFD600", fontWeight: "800" }}>404</h1> */}
        <h2 style={{ fontSize: "1.8rem", marginBottom: "15px" }}>Oops! You've strayed off the path.</h2>
        <p style={{ marginBottom: "30px", maxWidth: "600px", fontSize: "1.1rem", opacity: 0.9 }}>
          The page you are looking for might have been removed, or is temporarily unavailable.
        </p>
        <Link 
          to="/" 
          className="btn" 
          style={{ 
            padding: "14px 32px", 
            marginTop: "100px",
            marginBottom: "20px",
            backgroundColor: "#ffd600", // Bright yellow button
            color: "#000",              // Black text for contrast
            fontWeight: "bold",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "1rem",
            transition: "all 0.3s ease",
            backdropFilter: "blur(5px)",
            boxShadow: "0 4px 15px rgba(43, 37, 11, 0.3)"
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = "white";
            e.target.style.color = "black";
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = "transparent";
            e.target.style.color = "white";
          }}
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;