import React from 'react';

const HomePage = () => (
  <main>
    {/* All Notes, Archived Notes, Tags, Search, Create New Note, etc. */}
    <h1>All Notes</h1>
    <h2>Archived Notes</h2>
    <h2>Tags</h2>
    <input placeholder="Search by title, content, or tags" />
    <button>Create New Note</button>
    <div>
      <span>Tags</span>
      <span>Last Edited</span>
    </div>
    <button>Archive Note</button>
    <button>Delete Note</button>
    <button>Save Note</button>
    <button>Cancel</button>
  </main>
);

export default HomePage;
