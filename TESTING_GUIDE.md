# Testing Guide - UI/UX Improvements

## Quick Start

### 1. Start the Development Server

```bash
cd air-credential-issuance-template
npm run dev
```

The application will be available at: **http://localhost:3000**

### 2. Mock Configuration

The `.env.local` file is already configured with mock values for UI testing. No real credentials are needed.

## Testing Checklist

### ✅ Visual Design

- [ ] **Color Scheme**: Check that the professional blue theme is applied
- [ ] **Dark Mode**: Toggle dark mode and verify colors look good
- [ ] **Typography**: Verify font hierarchy and readability
- [ ] **Spacing**: Check consistent padding and margins
- [ ] **Shadows**: Verify subtle shadow effects on cards and buttons

### ✅ Multi-Step Wizard

- [ ] **Step 1 - Connect**
  - Progress indicator shows step 1 active
  - Hero section with headline is visible
  - Connect wallet button displays correctly
  - Help tooltip works on hover

- [ ] **Step 2 - Verify**
  - Progress indicator advances to step 2
  - User data displays in card format
  - "Back" and "Issue Credential" buttons present
  - Data fields are properly formatted

- [ ] **Step 3 - Issue**
  - Progress indicator shows step 3
  - Loading spinner is visible
  - "Issuing your credentials..." message displays
  - No interaction possible during loading

- [ ] **Step 4 - Success**
  - Progress indicator completes to step 4
  - Confetti animation plays
  - Success card with congratulations message
  - "What happens next?" information section
  - "Issue Another Credential" button works

### ✅ Loading States

- [ ] **Initial Page Load**
  - Animated shield icon with pulsing effect
  - Loading spinner and message
  - Professional appearance

- [ ] **Skeleton Screens**
  - Displays during data loading
  - Shows structure of content to come
  - Smooth transition to actual content

- [ ] **Button Loading States**
  - Spinner appears in button when loading
  - Button is disabled during loading
  - Clear visual feedback

### ✅ Error Handling

- [ ] **Error States**
  - Error message clearly displayed
  - Destructive color theme applied
  - "Retry" button is functional
  - Error doesn't break the flow

### ✅ Header Component

- [ ] **Logo & Branding**
  - Logo displays correctly
  - App name visible on desktop
  - "Powered by Moca Network" subtitle
  - Hover effect on logo

- [ ] **Account Dialog**
  - Clicking address opens dialog
  - Full address displayed
  - Chain information shown
  - "Disconnect Wallet" button works

### ✅ Responsive Design

#### Desktop (1280px+)
- [ ] Full layout displays properly
- [ ] All text is readable
- [ ] Progress steps are evenly spaced
- [ ] Cards have appropriate width

#### Tablet (768px - 1279px)
- [ ] Layout adjusts appropriately
- [ ] Text remains readable
- [ ] Buttons are touch-friendly
- [ ] Progress steps scale well

#### Mobile (< 768px)
- [ ] Single column layout
- [ ] Address is truncated
- [ ] App name hidden in header
- [ ] Touch targets are large enough
- [ ] Cards stack properly

### ✅ Accessibility

- [ ] **Keyboard Navigation**
  - Tab through all interactive elements
  - Focus states are visible
  - Enter/Space activates buttons
  - Dialogs can be closed with Escape

- [ ] **Screen Reader**
  - Buttons have descriptive labels
  - Images have alt text
  - Headings are properly structured

- [ ] **Color Contrast**
  - Text is readable against backgrounds
  - Meets WCAG AA standards
  - Works in both light and dark modes

### ✅ Interactions & Animations

- [ ] **Hover Effects**
  - Buttons show hover state
  - Links change on hover
  - Logo scales on hover
  - Smooth transitions

- [ ] **Click Feedback**
  - Buttons respond to clicks
  - Loading states activate
  - Dialogs open/close smoothly

- [ ] **Animations**
  - Progress indicator animates smoothly
  - Confetti plays on success
  - Skeleton screens pulse
  - Transitions are not jarring

### ✅ Tooltips

- [ ] Help icon displays in each step
- [ ] Tooltip appears on hover
- [ ] Content is helpful and clear
- [ ] Tooltip dismisses on mouse out

### ✅ Professional Polish

- [ ] **Visual Consistency**
  - Same border radius throughout
  - Consistent button styles
  - Uniform spacing
  - Cohesive color usage

- [ ] **Content Quality**
  - No typos or grammatical errors
  - Professional tone
  - Clear and concise messaging
  - Helpful guidance

## Testing Flow Scenarios

### Scenario 1: Happy Path

1. Load the page
2. See enhanced loading animation
3. Click "Connect Wallet"
4. View credential data in step 2
5. Click "Issue Credential"
6. Watch loading state in step 3
7. Experience confetti and success message
8. Click "Issue Another Credential"
9. Return to step 1

**Expected Result**: Smooth flow with no errors, clear guidance at each step

### Scenario 2: Error Recovery

1. Load the page
2. Simulate error in step 2 (if possible)
3. See error message
4. Click "Retry"
5. Successfully load data

**Expected Result**: Clear error messaging, easy recovery

### Scenario 3: Mobile Experience

1. Resize browser to mobile width (375px)
2. Navigate through all steps
3. Check header responsiveness
4. Test account dialog on mobile
5. Verify all text is readable

**Expected Result**: Fully functional on mobile, no horizontal scroll, readable text

### Scenario 4: Dark Mode

1. Switch to dark mode (system or browser setting)
2. Navigate through all steps
3. Check color contrast
4. Verify all elements are visible

**Expected Result**: Professional appearance in dark mode, good contrast

## Browser Testing

Test in the following browsers:

- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest)
- [ ] **Edge** (latest)
- [ ] **Mobile Safari** (iOS)
- [ ] **Chrome Mobile** (Android)

## Performance Checks

- [ ] Page loads quickly (< 3 seconds)
- [ ] Animations are smooth (60fps)
- [ ] No layout shifts during load
- [ ] No console errors
- [ ] No console warnings (except expected dev warnings)

## Known Limitations (Mock Mode)

1. **Wallet Connection**: May not work without real Reown project ID
2. **Credential Issuance**: Uses mock data, not real blockchain
3. **User Data**: Placeholder data only
4. **Network Calls**: Some may fail gracefully with mock config

These limitations are expected and only affect the backend integration, not the UI/UX.

## Reporting Issues

If you find any issues:

1. Note the browser and version
2. Describe the steps to reproduce
3. Include screenshots if relevant
4. Check browser console for errors
5. Note if it's specific to mobile or desktop

## Next Steps

After testing the UI:

1. **Configuration**: Replace mock values in `.env.local` with real credentials
2. **Integration**: Test with real wallet connections
3. **Deployment**: Deploy to staging environment
4. **User Testing**: Gather feedback from real users

---

**Happy Testing!** 🎉

If everything looks good, you're ready to proceed with the actual integration of Partner IDs and keys.
