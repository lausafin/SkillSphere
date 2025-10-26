// frontend/src/App.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Smoke Test', () => {
  it('renders the main App component without crashing', () => {
    // Render the App component
    render(<App />);

    // Check if the "SkillSphere" title is in the document.
    // This confirms the header, a core part of the app, has rendered.
    // The `i` flag makes the text match case-insensitive.
    const titleElement = screen.getByText(/skillsphere/i);
    
    // Assert that the element was found
    expect(titleElement).toBeInTheDocument();
  });
});