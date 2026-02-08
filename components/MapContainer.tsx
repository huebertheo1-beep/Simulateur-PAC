
import React from 'react';

interface Props {
  address: string;
  lat?: number;
  lng?: number;
}

export const MapContainer: React.FC<Props> = ({ address, lat, lng }) => {
  // Si on a des coordonnées, on les utilise pour un ciblage précis.
  // Sinon on utilise l'adresse textuelle.
  const query = (lat && lng) ? `${lat},${lng}` : encodeURIComponent(address || "France");
  const mapUrl = `https://maps.google.com/maps?q=${query}&t=k&z=20&ie=UTF8&iwloc=A&output=embed`;

  return (
    <div className="relative w-full h-72 bg-slate-900 rounded-2xl border-2 border-white shadow-lg mb-6 overflow-hidden group">
      {!address ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-slate-50 p-6 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-600">Recherchez votre adresse pour voir votre maison en 3D</p>
        </div>
      ) : (
        <>
          <iframe
            key={query} // Force le rafraîchissement lors d'un changement d'adresse
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src={mapUrl}
            title="Visualisation satellite de la maison"
            className="contrast-[1.1] brightness-[1.05] transition-all duration-1000 group-hover:scale-105"
          />

          <div className="absolute top-3 left-3 px-3 py-1.5 bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg border border-slate-700 pointer-events-none">
            Maison Sélectionnée
          </div>
        </>
      )}
    </div>
  );
};
