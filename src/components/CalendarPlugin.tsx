
import React from 'react';
import CalendarEventsList from './CalendarEventsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CalendarDays } from 'lucide-react';

const CalendarPlugin: React.FC = () => {
  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <div className="flex items-center mb-6">
        <CalendarDays className="h-6 w-6 mr-2 text-primary" />
        <h2 className="text-2xl font-semibold">Calendar</h2>
      </div>
      
      <CalendarEventsList />
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Voice Commands</CardTitle>
          <CardDescription>Try saying these phrases:</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="font-medium mr-2">•</span>
              "What's on my calendar today?"
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">•</span>
              "Add a meeting with John tomorrow at 3pm"
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">•</span>
              "Schedule a doctor appointment next Monday at 10am"
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPlugin;
