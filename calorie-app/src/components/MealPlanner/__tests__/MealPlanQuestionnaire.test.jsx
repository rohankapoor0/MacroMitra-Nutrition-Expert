/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MealPlanQuestionnaire from '../MealPlanQuestionnaire';

describe('MealPlanQuestionnaire Component', () => {
  it('renders all preference questions with clear options', () => {
    const { container } = render(<MealPlanQuestionnaire onSubmit={vi.fn()} />);

    // Question 1: Diet
    expect(screen.getByText(/What's your diet preference\?/i)).toBeInTheDocument();
    expect(container.querySelector('#diet-opt-vegetarian')).toBeInTheDocument();
    expect(container.querySelector('#diet-opt-non-vegetarian')).toBeInTheDocument();

    // Meat follow-up question must NOT be visible initially
    expect(screen.queryByText(/Which non-vegetarian foods do you eat\?/i)).not.toBeInTheDocument();

    // Question 2: Shakes
    expect(screen.getByText(/Do you want protein shakes\?/i)).toBeInTheDocument();
    expect(container.querySelector('#shake-opt-yes')).toBeInTheDocument();
    expect(container.querySelector('#shake-opt-no')).toBeInTheDocument();

    // Question 3: Caloric Beverages
    expect(screen.getByText(/Include caloric beverages in my meal plan\?/i)).toBeInTheDocument();
    expect(container.querySelector('#beverage-opt-yes')).toBeInTheDocument();
    expect(container.querySelector('#beverage-opt-no')).toBeInTheDocument();

    // Question 4: Sugar
    expect(screen.getByText(/What's your sugar preference\?/i)).toBeInTheDocument();
    expect(container.querySelector('#sugar-opt-free')).toBeInTheDocument();
    expect(container.querySelector('#sugar-opt-okay')).toBeInTheDocument();
  });

  it('meat-selection question appears only for non-vegetarian users and supports multi-select', () => {
    const { container } = render(<MealPlanQuestionnaire onSubmit={vi.fn()} />);

    // Select vegetarian -> No meat question
    fireEvent.click(container.querySelector('#diet-opt-vegetarian'));
    expect(screen.queryByText(/Which non-vegetarian foods do you eat\?/i)).not.toBeInTheDocument();

    // Select non-vegetarian -> Meat question appears
    fireEvent.click(container.querySelector('#diet-opt-non-vegetarian'));
    expect(screen.getByText(/Which non-vegetarian foods do you eat\?/i)).toBeInTheDocument();

    // Verify all meat options are present
    expect(container.querySelector('#meat-opt-eggs')).toBeInTheDocument();
    expect(container.querySelector('#meat-opt-chicken')).toBeInTheDocument();
    expect(container.querySelector('#meat-opt-fish')).toBeInTheDocument();
    expect(container.querySelector('#meat-opt-mutton')).toBeInTheDocument();
    expect(container.querySelector('#meat-opt-other_meat')).toBeInTheDocument();

    // Multi-select Eggs and Chicken
    fireEvent.click(container.querySelector('#meat-opt-eggs'));
    fireEvent.click(container.querySelector('#meat-opt-chicken'));

    // Switch back to vegetarian -> Meat question disappears and selection cleared
    fireEvent.click(container.querySelector('#diet-opt-vegetarian'));
    expect(screen.queryByText(/Which non-vegetarian foods do you eat\?/i)).not.toBeInTheDocument();
  });

  it('blocks generation when required answers are not selected or when non-veg has no meat selected', () => {
    const handleSubmit = vi.fn();
    const { container } = render(<MealPlanQuestionnaire onSubmit={handleSubmit} />);

    const submitBtn = container.querySelector('#generate-meal-plan-btn');
    fireEvent.click(submitBtn);

    // Submission blocked
    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Please answer all.*questions before generating your meal plan/i)).toBeInTheDocument();

    // Select non-veg, but do not pick any meat
    fireEvent.click(container.querySelector('#diet-opt-non-vegetarian'));
    fireEvent.click(container.querySelector('#shake-opt-no'));
    fireEvent.click(container.querySelector('#beverage-opt-no'));
    fireEvent.click(container.querySelector('#sugar-opt-free'));
    fireEvent.click(submitBtn);

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Please select at least one non-vegetarian food type/i)).toBeInTheDocument();
  });

  it('successfully submits vegetarian plan with empty meat preferences and beverage preference', () => {
    const handleSubmit = vi.fn();
    const { container } = render(<MealPlanQuestionnaire onSubmit={handleSubmit} />);

    // Select Diet: Vegetarian
    fireEvent.click(container.querySelector('#diet-opt-vegetarian'));

    // Select Shakes: No protein shakes
    fireEvent.click(container.querySelector('#shake-opt-no'));

    // Select Beverages: No caloric beverages
    fireEvent.click(container.querySelector('#beverage-opt-no'));

    // Select Sugar: Sugar-free
    fireEvent.click(container.querySelector('#sugar-opt-free'));

    // Submit
    fireEvent.click(container.querySelector('#generate-meal-plan-btn'));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith({
      dietPreference: 'vegetarian',
      meatPreferences: [],
      shakePreference: 'no',
      beveragePreference: 'no',
      sugarPreference: 'sugar-free'
    });
  });

  it('successfully submits non-vegetarian plan with multi-selected meat and beverage preferences', () => {
    const handleSubmit = vi.fn();
    const { container } = render(<MealPlanQuestionnaire onSubmit={handleSubmit} />);

    // Select Diet: Non-vegetarian
    fireEvent.click(container.querySelector('#diet-opt-non-vegetarian'));

    // Multi-select Eggs and Chicken
    fireEvent.click(container.querySelector('#meat-opt-eggs'));
    fireEvent.click(container.querySelector('#meat-opt-chicken'));

    // Select Shakes: Yes
    fireEvent.click(container.querySelector('#shake-opt-yes'));

    // Select Beverages: Yes
    fireEvent.click(container.querySelector('#beverage-opt-yes'));

    // Select Sugar: Okay
    fireEvent.click(container.querySelector('#sugar-opt-okay'));

    // Submit
    fireEvent.click(container.querySelector('#generate-meal-plan-btn'));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith({
      dietPreference: 'non-vegetarian',
      meatPreferences: ['eggs', 'chicken'],
      shakePreference: 'yes',
      beveragePreference: 'yes',
      sugarPreference: 'sugar-okay'
    });
  });

  it('renders polished loading state when isGenerating is true', () => {
    render(<MealPlanQuestionnaire onSubmit={vi.fn()} isGenerating={true} />);

    expect(screen.getByText(/Formulating Meal Blueprint.../i)).toBeInTheDocument();
    expect(screen.getByText(/Analyzing 1,100\+ Indian dishes for your preferences/i)).toBeInTheDocument();
  });
});
