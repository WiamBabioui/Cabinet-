import React, { createContext, useContext, useState } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [patients, setPatients] = useState([
    { id: 1, name: 'John Doe', age: 45, gender: 'Male', lastVisit: '2023-10-15', status: 'Healthy', email: 'john@example.com', phone: '+123456789' },
    { id: 2, name: 'Jane Smith', age: 32, gender: 'Female', lastVisit: '2023-11-20', status: 'Treatment', email: 'jane@example.com', phone: '+123456780' },
    { id: 3, name: 'Robert Brown', age: 58, gender: 'Male', lastVisit: '2023-11-22', status: 'Recovery', email: 'robert@example.com', phone: '+123456781' },
    { id: 4, name: 'Emma Wilson', age: 28, gender: 'Female', lastVisit: '2023-11-25', status: 'Pending', email: 'emma@example.com', phone: '+123456782' },
  ]);

  const [appointments, setAppointments] = useState([
    { id: 1, patientName: 'John Doe', time: '09:00 AM', date: '2023-11-28', type: 'Checkup', status: 'Confirmed' },
    { id: 2, patientName: 'Jane Smith', time: '11:30 AM', date: '2023-11-28', type: 'Consultation', status: 'Pending' },
    { id: 3, patientName: 'Robert Brown', time: '02:00 PM', date: '2023-11-28', type: 'Follow-up', status: 'Cancelled' },
  ]);

  const addPatient = (newPatient) => {
    setPatients([...patients, { ...newPatient, id: patients.length + 1 }]);
  };

  const scheduleAppointment = (appointment) => {
    setAppointments([...appointments, { ...appointment, id: appointments.length + 1 }]);
  };

  return (
    <DataContext.Provider value={{ patients, appointments, addPatient, scheduleAppointment }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
