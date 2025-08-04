import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './mainPage.css';

const MainPage = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3001/users')
      .then((res) => {
        setUsers(res.data);
        setFilteredUsers(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchQuery(value);

    const filtered = users.filter(user =>
      user.first_name.toLowerCase().includes(value) ||
      user.last_name.toLowerCase().includes(value) ||
      user.email.toLowerCase().includes(value)
    );

    setFilteredUsers(filtered);
  };

  return (
    <div className="main-container">
      <h1>Customer List</h1>
      <input
        type="text"
        placeholder="Search by name or email"
        value={searchQuery}
        onChange={handleSearch}
        className="search-input"
      />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Gender</th>
              <th>City</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>{user.first_name} {user.last_name}</td>
                <td>{user.email}</td>
                <td>{user.gender}</td>
                <td>{user.city}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MainPage;
