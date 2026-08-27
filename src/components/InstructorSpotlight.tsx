import React from 'react';
import { Instructor } from '../types';
import { X, Award, Briefcase } from 'lucide-react';

interface InstructorSpotlightProps {
  instructor: Instructor;
  onClose: () => void;
}

export default function InstructorSpotlight({ instructor, onClose }: InstructorSpotlightProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-neutral-bg border border-neutral-medium/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-light transition"
        >
          <X className="h-5 w-5 text-neutral-medium" />
        </button>
        
        <div className="p-8 text-center">
          <img src={instructor.thumbnail} alt={instructor.name} className="h-24 w-24 rounded-full mx-auto mb-6 object-cover" />
          <h2 className="text-2xl font-bold font-display text-neutral-dark">{instructor.name}</h2>
          <p className="text-neutral-medium mt-2">{instructor.bio}</p>
          
          <div className="mt-8 text-left space-y-4">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-bold text-neutral-dark text-sm">Experience</h4>
                <p className="text-xs text-neutral-medium">{instructor.experience}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <h4 className="font-bold text-neutral-dark text-sm">Certifications</h4>
                <ul className="text-xs text-neutral-medium list-disc ml-4">
                  {instructor.certifications.map((cert, i) => <li key={i}>{cert}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
