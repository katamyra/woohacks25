"use client";

import React, { useEffect, useState } from "react";

const About = () => {
  const [projectInfo, setProjectInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <div className="text-3xl font-bold text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto bg-gray-200 dark:bg-gray-900 rounded-2xl shadow-2xl p-10 transform transition-all duration-500 hover:scale-105">
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
            <img
              src={projectInfo.team.team_picture}
              alt="Team"
              className="w-64 h-64 object-cover rounded-full shadow-xl mb-8 border-4 border-blue-600"
            />
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

        <section>
          <h2 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Project Pictures
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projectInfo.pictures.map((picture, index) => (
              <img
                key={index}
                src={picture}
                alt={`Project Image ${index + 1}`}
                className="w-full h-auto rounded-lg shadow-xl transform transition-transform duration-500 hover:scale-105"
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
