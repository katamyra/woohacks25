"use client";

import React, { useEffect, useRef, useState } from "react";

const About = () => {
  const [projectInfo, setProjectInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  // Horizontal slider refs & vars for bottom gallery
  const sliderRef = useRef(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const velocity = useRef(0);
  const momentumID = useRef(null);

  const handleMouseDown = (e) => {
    isDown.current = true;
    startX.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeft.current = sliderRef.current.scrollLeft;
    velocity.current = 0;
    if (momentumID.current) {
      cancelAnimationFrame(momentumID.current);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDown.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = x - startX.current;
    velocity.current = walk;
    sliderRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDown.current = false;
    applyMomentum();
  };

  const handleMouseLeave = () => {
    if (isDown.current) {
      isDown.current = false;
      applyMomentum();
    }
  };

  const applyMomentum = () => {
    let currentVelocity = velocity.current;
    const decay = 0.95;
    const step = () => {
      if (Math.abs(currentVelocity) > 0.5) {
        sliderRef.current.scrollLeft -= currentVelocity;
        currentVelocity *= decay;
        momentumID.current = requestAnimationFrame(step);
      }
    };
    step();
  };

  // Vertical slider refs & vars for modal gallery
  const verticalSliderRef = useRef(null);
  const verticalIsDown = useRef(false);
  const startY = useRef(0);
  const scrollTopVertical = useRef(0);
  const verticalVelocity = useRef(0);
  const verticalMomentumID = useRef(null);

  const handleVerticalMouseDown = (e) => {
    verticalIsDown.current = true;
    startY.current = e.pageY - verticalSliderRef.current.offsetTop;
    scrollTopVertical.current = verticalSliderRef.current.scrollTop;
    verticalVelocity.current = 0;
    if (verticalMomentumID.current) {
      cancelAnimationFrame(verticalMomentumID.current);
    }
  };

  const handleVerticalMouseMove = (e) => {
    if (!verticalIsDown.current) return;
    e.preventDefault();
    const y = e.pageY - verticalSliderRef.current.offsetTop;
    const walk = y - startY.current;
    verticalVelocity.current = walk;
    verticalSliderRef.current.scrollTop = scrollTopVertical.current - walk;
  };

  const handleVerticalMouseUp = () => {
    verticalIsDown.current = false;
    applyVerticalMomentum();
  };

  const handleVerticalMouseLeave = () => {
    if (verticalIsDown.current) {
      verticalIsDown.current = false;
      applyVerticalMomentum();
    }
  };

  const applyVerticalMomentum = () => {
    let currentVelocity = verticalVelocity.current;
    const decay = 0.95;
    const step = () => {
      if (Math.abs(currentVelocity) > 0.5) {
        verticalSliderRef.current.scrollTop -= currentVelocity;
        currentVelocity *= decay;
        verticalMomentumID.current = requestAnimationFrame(step);
      }
    };
    step();
  };

  useEffect(() => {
    const fetchProjectInfo = async () => {
      try {
        const response = await fetch("/data/projectInfo.json");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setProjectInfo(data.projectInfo);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-3xl font-bold text-gray-800">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-3xl font-bold text-red-500">
          Error: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-4 px-4 pb-12">
      <div
        className="max-w-4xl mx-auto bg-gray-200 dark:bg-gray-900 rounded-2xl shadow-2xl p-10 transform transition-all duration-500"
        style={{ transform: "scale(0.93)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.transform = "scale(0.975)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.transform = "scale(0.93)")
        }
      >
        <h1 className="text-center text-5xl font-extrabold text-gray-900 dark:text-white mb-8">
          {projectInfo.name}
        </h1>
        <p className="text-center text-xl text-gray-700 dark:text-gray-300 mb-10">
          {projectInfo.description}
        </p>
        <div className="flex justify-center mb-12">
          <a
            href={projectInfo.github}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold rounded-full shadow-lg"
          >
            View on GitHub
          </a>
        </div>

        <section className="mb-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Team Members
          </h2>
          <div className="flex flex-col items-center">
            {/* Particle animations (gold) */}
            <div className="relative w-full flex justify-center items-center p-4">
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                  className="absolute bg-amber-500 opacity-60 rounded-full w-3 h-3 animate-shootingStar"
                  style={{ top: "10%", left: "15%", animationDelay: "0s" }}
                ></div>
                <div
                  className="absolute bg-amber-500 opacity-60 rounded-full w-4 h-4 animate-shootingStar"
                  style={{ top: "25%", left: "80%", animationDelay: "0.5s" }}
                ></div>
                <div
                  className="absolute bg-amber-500 opacity-60 rounded-full w-3 h-3 animate-shootingStar"
                  style={{ top: "40%", left: "40%", animationDelay: "1s" }}
                ></div>
                <div
                  className="absolute bg-amber-500 opacity-60 rounded-full w-4 h-4 animate-shootingStar"
                  style={{ top: "55%", left: "70%", animationDelay: "1.5s" }}
                ></div>
                <div
                  className="absolute bg-amber-500 opacity-60 rounded-full w-3 h-3 animate-shootingStar"
                  style={{ top: "70%", left: "20%", animationDelay: "2s" }}
                ></div>
                <div
                  className="absolute bg-amber-500 opacity-60 rounded-full w-4 h-4 animate-shootingStar"
                  style={{ top: "85%", left: "50%", animationDelay: "2.5s" }}
                ></div>
                <div
                  className="absolute bg-amber-500 opacity-60 rounded-full w-3 h-3 animate-shootingStar"
                  style={{ top: "15%", left: "60%", animationDelay: "3s" }}
                ></div>
                <div
                  className="absolute bg-amber-500 opacity-60 rounded-full w-4 h-4 animate-shootingStar"
                  style={{ top: "30%", left: "30%", animationDelay: "3.5s" }}
                ></div>
              </div>
              <img
                src={projectInfo.team.team_picture}
                alt="Team"
                className="relative w-64 h-64 object-cover rounded-full shadow-xl mb-8 border-4 border-blue-600"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {projectInfo.team.members.map((member) => (
                <div
                  key={member.name}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {member.school}, {member.major}
                  </p>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline font-medium"
                  >
                    Connect on LinkedIn
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Technologies Used
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {Object.entries(projectInfo.tags).map(([category, technologies]) => (
              <div
                key={category}
                className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                  {category}
                </h3>
                <ul className="space-y-3">
                  {technologies.map((tech) => (
                    <li key={tech.name} className="flex items-center">
                      <img
                        src={tech.icon}
                        alt={tech.name}
                        className="w-8 h-8 mr-3"
                      />
                      <span className="text-lg text-gray-700 dark:text-gray-300">
                        {tech.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Horizontal picture slider */}
        <section className="mt-16">
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Project Pictures
          </h2>
          <div
            ref={sliderRef}
            className="relative overflow-x-auto rounded-lg shadow-xl select-none cursor-grab bg-gray-800"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex px-4">
              {projectInfo.pictures.map((picture, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center m-4 min-w-[16rem]"
                >
                  <div className="w-64 h-64 bg-gray-100 dark:bg-gray-700 rounded-lg shadow-xl flex items-center justify-center overflow-hidden">
                    <img
                      src={picture.src}
                      alt={`Project Image ${index + 1}`}
                      className="object-contain w-full h-full transition-transform duration-300 hover:scale-105 cursor-pointer"
                      onClick={() => setSelectedImage(picture)}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <h3 className="font-semibold text-white">{picture.title}</h3>
                    <p className="text-sm text-gray-400">{picture.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* Selected image w/ vertical slider */}
      {selectedImage && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-transparent flex flex-col md:flex-row items-center p-4 rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <img
                src={selectedImage.src}
                alt={selectedImage.title}
                className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
              />
              <div className="mt-4 text-center">
                <h3 className="text-2xl font-bold text-white">
                  {selectedImage.title}
                </h3>
                <p className="text-lg text-white">{selectedImage.caption}</p>
              </div>
            </div>
            {/* Vertical inertia slider */}
            <div
              ref={verticalSliderRef}
              className="ml-4 md:ml-8 w-32 h-[80vh] overflow-y-auto rounded-lg shadow-xl select-none cursor-grab"
              onMouseDown={handleVerticalMouseDown}
              onMouseMove={handleVerticalMouseMove}
              onMouseUp={handleVerticalMouseUp}
              onMouseLeave={handleVerticalMouseLeave}
            >
              <div className="flex flex-col space-y-4 p-2">
                {projectInfo.pictures.map((picture, idx) => (
                  <div
                    key={idx}
                    className="cursor-pointer hover:bg-gray-700 rounded p-1"
                    onClick={() => setSelectedImage(picture)}
                  >
                    <img
                      src={picture.src}
                      alt={picture.title}
                      className="w-full h-20 object-cover rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes shootingStar {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translate(100px, -100px);
            opacity: 0;
          }
        }
        .animate-shootingStar {
          animation: shootingStar 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default About;
