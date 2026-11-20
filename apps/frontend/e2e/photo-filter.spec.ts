import { test, expect } from '@playwright/test';

test.describe('Photo Gallery - Upload and Filter', () => {
  const testImagePath = './public/tourist-lux.png';
  const baseUrl = 'http://localhost:42512';

  test.beforeEach(async ({ page }) => {
    // Navigate to the photo gallery
    await page.goto(baseUrl);
    
    // Wait for the page to load
    await page.waitForLoadState('domcontentloaded');
  });

  test('should upload a test image with tags and verify it appears in the gallery', async ({ page }) => {
    // 1. Add tags to the upload form
    const tagInput = page.getByRole('textbox', { name: 'Tags' });
    
    // Add first tag
    await tagInput.fill('tourist');
    await page.getByRole('button', { name: 'Add Tag' }).click();
    
    // Add second tag
    await tagInput.fill('luxembourg');
    await page.getByRole('button', { name: 'Add Tag' }).click();
    
    // Verify tags were added
    const tagCount = page.locator('text=2 / 20 tags');
    await expect(tagCount).toBeVisible();
    
    // 2. Select and upload a test image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    
    // Verify file is selected
    await expect(page.getByText('tourist-lux.png')).toBeVisible();
    
    // Click upload button
    await page.getByRole('button', { name: 'Upload Photo' }).click();
    
    // Wait for success message
    const successMessage = page.getByText('Successfully uploaded');
    await expect(successMessage).toBeVisible();
    
    // Verify photo appears in gallery
    const photoButton = page.getByRole('button', { name: 'tourist-lux.png' });
    await expect(photoButton).toBeVisible();
    
    // Verify photo count updated
    const photoCount = page.getByText('1 photo');
    await expect(photoCount).toBeVisible();
  });

  test('should apply filter and display only filtered photos', async ({ page }) => {
    // First, upload a test image with tags
    const tagInput = page.getByRole('textbox', { name: 'Tags' });
    
    // Upload image: tourist, luxembourg
    await tagInput.fill('tourist');
    await page.getByRole('button', { name: 'Add Tag' }).click();
    
    await tagInput.fill('luxembourg');
    await page.getByRole('button', { name: 'Add Tag' }).click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    await page.getByRole('button', { name: 'Upload Photo' }).click();
    
    // Wait for upload to complete
    await expect(page.getByText('Successfully uploaded')).toBeVisible();
    
    // Wait for the filter sidebar to have the tourist checkbox
    const touristCheckbox = page.getByRole('checkbox', { name: /tourist/ });
    await expect(touristCheckbox).toBeVisible();
    
    // 1. Apply filter - select the 'tourist' checkbox
    await touristCheckbox.click();
    
    // 2. Verify filter was applied
    // Check that filter status shows in header
    const filterStatus = page.getByText(/filtered by:/);
    await expect(filterStatus).toBeVisible();
    
    // Verify the "Clear Filters" button appears
    const clearButton = page.getByRole('button', { name: 'Clear Filters' });
    await expect(clearButton).toBeVisible();
    
    // Verify photos are displayed (at least one with 'tourist' tag)
    const photoItem = page.getByRole('button', { name: /\.png/ }).first();
    await expect(photoItem).toBeVisible();
    
    // 3. Verify the filtered result count
    // The page should show filtered results
    const photoCountWithFilter = page.getByText(/photo.*filtered by:/);
    await expect(photoCountWithFilter).toBeVisible();
  });

  test('should clear filter and show all photos again', async ({ page }) => {
    // First upload a photo with tags
    const tagInput = page.getByRole('textbox', { name: 'Tags' });
    await tagInput.fill('tourist');
    await page.getByRole('button', { name: 'Add Tag' }).click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    await page.getByRole('button', { name: 'Upload Photo' }).click();
    
    // Wait for upload
    await expect(page.getByText('Successfully uploaded')).toBeVisible();
    
    // Wait for filter checkbox to appear
    const touristCheckbox = page.getByRole('checkbox', { name: /tourist/ });
    await expect(touristCheckbox).toBeVisible();
    
    // Apply a filter
    await touristCheckbox.click();
    
    // Verify filter is applied
    await expect(page.getByText(/filtered by:/)).toBeVisible();
    
    // Clear the filter
    const clearButton = page.getByRole('button', { name: 'Clear Filters' });
    await clearButton.click();
    
    // Verify "Clear Filters" button is gone
    await expect(clearButton).not.toBeVisible();
    
    // Verify all photos are shown again (without filter text)
    const photoGalleryHeader = page.getByText(/\d+ photo/);
    await expect(photoGalleryHeader).toBeVisible();
    
    // Verify no filter status is shown
    const filterStatus = page.getByText(/filtered by:/);
    await expect(filterStatus).not.toBeVisible();
  });

  test('should maintain storage persistence across page reload', async ({ page }) => {
    // Upload a photo
    const tagInput = page.getByRole('textbox', { name: 'Tags' });
    await tagInput.fill('persistent');
    await page.getByRole('button', { name: 'Add Tag' }).click();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);
    await page.getByRole('button', { name: 'Upload Photo' }).click();
    
    // Wait for upload
    await expect(page.getByText('Successfully uploaded')).toBeVisible();
    
    // Reload the page
    await page.reload();
    
    // Verify the photo is still there
    const photoButton = page.getByRole('button', { name: 'tourist-lux.png' });
    await expect(photoButton).toBeVisible();
    
    // Verify the tag is still there
    const persistentTag = page.getByRole('checkbox', { name: /persistent/ });
    await expect(persistentTag).toBeVisible();
  });
});
