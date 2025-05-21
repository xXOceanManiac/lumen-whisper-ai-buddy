
import React from 'react';
import CalendarEventsList from './CalendarEventsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CalendarDays, Clock } from 'lucide-react';

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
              "Remind me to call mom at 5pm"
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">•</span>
              "Set a reminder for my doctor appointment on Friday at 10am"
            </li>
          </ul>
        </CardContent>
      </Card>
      
      <Card className="mt-4">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-primary" />
            <CardTitle className="text-sm">Reminder Examples</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="text-xs space-y-1 text-gray-600">
            <li>"Remind me to walk the dog at 3 PM"</li>
            <li>"Set a reminder to call mom tomorrow at noon"</li>
            <li>"Add a reminder for my meeting on Friday at 10"</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPlugin;
