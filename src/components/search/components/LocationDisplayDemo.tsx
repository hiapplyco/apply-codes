import React from 'react';
import { Card } from '@/components/ui/card';
import { GoogleStyleLocationDisplay } from './LocationDisplay';

export const LocationDisplayDemo: React.FC = () => {
  const examples = [
    {
      location: "Atlanta Metropolitan Area",
      company: "IGEL Technology",
      description: "Google-style with location and company"
    },
    {
      location: "San Francisco Bay Area",
      company: "IBM",
      description: "Metro area format"
    },
    {
      location: "New York, NY",
      company: "Microsoft",
      description: "City, State format"
    },
    {
      location: "London, United Kingdom",
      company: "Accenture",
      description: "International format"
    },
    {
      location: "",
      company: "Apple",
      description: "Company only (when no location available)"
    },
    {
      location: "Remote",
      company: "Stripe",
      description: "Remote work location"
    }
  ];

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-xl font-semibold mb-4">Location Display Examples</h2>
      {examples.map((example, index) => (
        <Card key={index} className="p-4 border-2 border-gray-200">
          <div className="mb-2">
            <h3 className="font-medium text-gray-900">Example Profile {index + 1}</h3>
            <p className="text-sm text-gray-500">{example.description}</p>
          </div>
          <GoogleStyleLocationDisplay 
            location={example.location}
            company={example.company}
            className="mb-2"
          />
          <div className="text-xs text-gray-400 mt-2">
            Location: "{example.location}", Company: "{example.company}"
          </div>
        </Card>
      ))}
    </div>
  );
};