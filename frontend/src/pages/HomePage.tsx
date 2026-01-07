import React from 'react';
import {Button} from '@/components/ui/button';

const HomePage = () => (
  <main>
    {/* All Notes, Archived Notes, Tags, Search, Create New Note, etc. */}
    <h1>All Notes</h1>
    <h2>Archived Notes</h2>
    <h2>Tags</h2>
    <input placeholder="Search by title, content, or tags" />
    <Button>Create New Note</Button>
    <div>
      <span>Tags</span>
      <span>Last Edited</span>
    </div>
    <Button>Archive Note</Button>
    <Button>Delete Note</Button>
    <Button>Save Note</Button>
    <Button>Cancel</Button>
  </main>
);

export default HomePage;
