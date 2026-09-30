import React from "react";
import Header from "../components/Header";
import Hero from "../components/Hero";
import JadwalPublik from "../components/JadwalPublik";
import Footer from "../components/Footer";

const Beranda: React.FC = () => {
  return (
    <>
      <Header />
      <main className="flex-grow">
        <Hero />
        <JadwalPublik />
      </main>
      <Footer />
    </>
  );
};

export default Beranda;
