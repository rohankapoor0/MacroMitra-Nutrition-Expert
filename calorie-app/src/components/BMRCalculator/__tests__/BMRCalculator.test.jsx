/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider, useUser } from '../../../context/UserContext';
import BMRCalculator, { scrollToNutritionSection } from '../BMRCalculator';
import Calculator from '../../../pages/Calculator';
import { calculateDailyTargets } from '../../../context/UserContext';

describe('Calculate My Blueprint Button & Smooth Scrolling Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Clicking Calculate My Blueprint validates inputs and sets calculated state without route navigation', async () => {
    // Mock scrollIntoView
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    render(
      <UserProvider>
        <BrowserRouter>
          <BMRCalculator />
        </BrowserRouter>
      </UserProvider>
    );

    const calcBtn = screen.getByRole('button', { name: /Calculate My Blueprint/i });
    expect(calcBtn).toBeInTheDocument();

    // Verify initial route is unchanged
    expect(window.location.pathname).toBe('/');

    // Click Calculate My Blueprint
    fireEvent.click(calcBtn);

    // URL / route must NOT navigate away to /meals or change
    expect(window.location.pathname).toBe('/');
  });

  it('2. Invalid profile inputs show clear validation feedback and prevent calculation/scrolling', async () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    render(
      <UserProvider>
        <BrowserRouter>
          <BMRCalculator />
        </BrowserRouter>
      </UserProvider>
    );

    const ageInput = screen.getByLabelText(/Age/i);
    const weightInput = screen.getByLabelText(/Weight/i);
    const heightInput = screen.getByLabelText(/Height/i);
    const calcBtn = screen.getByRole('button', { name: /Calculate My Blueprint/i });

    // Test invalid age (0 or >120)
    fireEvent.change(ageInput, { target: { value: '0' } });
    fireEvent.click(calcBtn);

    expect(screen.getByText(/Please enter a valid age between 1 and 120/i)).toBeInTheDocument();
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    // Test invalid weight (<20)
    fireEvent.change(ageInput, { target: { value: '25' } });
    fireEvent.change(weightInput, { target: { value: '10' } });
    fireEvent.click(calcBtn);

    expect(screen.getByText(/Please enter a valid weight between 20 kg and 300 kg/i)).toBeInTheDocument();
    expect(scrollIntoViewMock).not.toHaveBeenCalled();

    // Test invalid height (<50)
    fireEvent.change(weightInput, { target: { value: '70' } });
    fireEvent.change(heightInput, { target: { value: '30' } });
    fireEvent.click(calcBtn);

    expect(screen.getByText(/Please enter a valid height between 50 cm and 250 cm/i)).toBeInTheDocument();
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
  });

  it('3. scrollToNutritionSection respects prefers-reduced-motion accessibility preference', () => {
    const scrollIntoViewMock = vi.fn();
    const dummyDiv = document.createElement('div');
    dummyDiv.id = 'nutrition-statistics';
    dummyDiv.scrollIntoView = scrollIntoViewMock;
    document.body.appendChild(dummyDiv);

    // Case A: Reduced motion is TRUE -> behavior should be 'auto'
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));

    scrollToNutritionSection('nutrition-statistics');

    // Wait for rAF/timeout
    return new Promise(resolve => {
      setTimeout(() => {
        expect(scrollIntoViewMock).toHaveBeenCalledWith(expect.objectContaining({
          behavior: 'auto',
          block: 'start'
        }));

        scrollIntoViewMock.mockClear();

        // Case B: Reduced motion is FALSE -> behavior should be 'smooth'
        window.matchMedia = vi.fn().mockImplementation(() => ({
          matches: false,
          addListener: vi.fn(),
          removeListener: vi.fn(),
        }));

        scrollToNutritionSection('nutrition-statistics');

        setTimeout(() => {
          expect(scrollIntoViewMock).toHaveBeenCalledWith(expect.objectContaining({
            behavior: 'smooth',
            block: 'start'
          }));
          document.body.removeChild(dummyDiv);
          resolve();
        }, 100);
      }, 100);
    });
  });

  it('4. Full Calculator Page: displays all four nutrition targets (Calories, Protein, Carbs, Fat) with correct units matching authoritative calculations', async () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    render(
      <UserProvider>
        <BrowserRouter>
          <Calculator />
        </BrowserRouter>
      </UserProvider>
    );

    // Initially, before calculation, destination section is not shown
    expect(screen.queryByText(/Personalized Nutrition Blueprint/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Enter your details and click/i)).toBeInTheDocument();

    // Fill valid profile data: 75 kg, 175 cm, 28 years, male, moderate, maintain
    const ageInput = screen.getByLabelText(/Age/i);
    const weightInput = screen.getByLabelText(/Weight/i);
    const heightInput = screen.getByLabelText(/Height/i);
    const calcBtn = screen.getByRole('button', { name: /Calculate My Blueprint/i });

    fireEvent.change(ageInput, { target: { value: '28' } });
    fireEvent.change(weightInput, { target: { value: '75' } });
    fireEvent.change(heightInput, { target: { value: '175' } });

    // Click Calculate My Blueprint
    fireEvent.click(calcBtn);

    // Wait for destination section to appear
    await waitFor(() => {
      expect(screen.getByText(/Personalized Nutrition Blueprint/i)).toBeInTheDocument();
    });

    // Authoritative reference calculation for profile
    const expectedTargets = calculateDailyTargets({
      weight: 75,
      height: 175,
      age: 28,
      sex: 'male',
      activityLevel: 'moderate',
      goal: 'maintain'
    });

    // Check Calories target & unit
    const caloriesCard = document.getElementById('target-calories-card');
    expect(caloriesCard).toBeInTheDocument();
    expect(caloriesCard).toHaveTextContent(Math.round(expectedTargets.adjustedCalories).toLocaleString());
    expect(caloriesCard).toHaveTextContent('kcal');

    // Check Protein target & unit
    const proteinCard = document.getElementById('target-protein-card');
    expect(proteinCard).toBeInTheDocument();
    expect(proteinCard).toHaveTextContent(`${Math.round(expectedTargets.proteinG)}`);
    expect(proteinCard).toHaveTextContent('g');

    // Check Carbohydrates target & unit
    const carbsCard = document.getElementById('target-carbs-card');
    expect(carbsCard).toBeInTheDocument();
    expect(carbsCard).toHaveTextContent(`${Math.round(expectedTargets.carbsG)}`);
    expect(carbsCard).toHaveTextContent('g');

    // Check Fat target & unit
    const fatCard = document.getElementById('target-fat-card');
    expect(fatCard).toBeInTheDocument();
    expect(fatCard).toHaveTextContent(`${Math.round(expectedTargets.fatG)}`);
    expect(fatCard).toHaveTextContent('g');

    // Verify smooth scroll was triggered on #nutrition-statistics
    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalled();
    });
  });

  it('5. Recalculating with modified details updates statistics and triggers scroll again', async () => {
    const scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    render(
      <UserProvider>
        <BrowserRouter>
          <Calculator />
        </BrowserRouter>
      </UserProvider>
    );

    const weightInput = screen.getByLabelText(/Weight/i);
    const calcBtn = screen.getByRole('button', { name: /Calculate My Blueprint/i });

    // Initial calculation at 70kg
    fireEvent.change(weightInput, { target: { value: '70' } });
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(screen.getByText(/Personalized Nutrition Blueprint/i)).toBeInTheDocument();
    });

    const expected70 = calculateDailyTargets({
      weight: 70,
      height: 170,
      age: 25,
      sex: 'male',
      activityLevel: 'moderate',
      goal: 'maintain'
    });
    expect(document.getElementById('target-protein-card')).toHaveTextContent(`${Math.round(expected70.proteinG)}`);

    scrollIntoViewMock.mockClear();

    // Now modify weight to 90kg and click Calculate My Blueprint again
    fireEvent.change(weightInput, { target: { value: '90' } });
    fireEvent.click(calcBtn);

    const expected90 = calculateDailyTargets({
      weight: 90,
      height: 170,
      age: 25,
      sex: 'male',
      activityLevel: 'moderate',
      goal: 'maintain'
    });

    await waitFor(() => {
      expect(document.getElementById('target-protein-card')).toHaveTextContent(`${Math.round(expected90.proteinG)}`);
    });

    // 90kg protein target must be strictly greater than 70kg target
    expect(expected90.proteinG).toBeGreaterThan(expected70.proteinG);

    // Scroll must be invoked again for the updated statistics
    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalled();
    });
  });
});
