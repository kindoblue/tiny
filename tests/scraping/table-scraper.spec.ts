import { test, expect } from '@playwright/test';

test('scrape table data', async ({ page }) => {
  // Navigate to the website
  await page.goto('https://www.hcb.net/it/team/team/');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Accept cookies - adjust the selector based on the actual cookie banner
  try {
    await page.click('.wf-cookie-consent__action');
  } catch (error) {
    console.log('Cookie banner not found or already accepted');
  }

  // Wait a moment for the cookie banner to disappear
  await page.waitForTimeout(400);
  

  // Wait for the table to be visible - using a more specific selector
  const table = await page.waitForSelector('.hockeydata');

  // Get all rows from the table
  const rows = await page.$$('.hockeydata tbody tr');

  const tableData = [];

  // Iterate through rows and extract data
  for (const row of rows) {
    const cells = await row.$$('td');
    const rowData = [];
    
    for (const cell of cells) {
      const text = await cell.textContent();
      rowData.push(text?.trim());
    }

    if (rowData.length > 0) {
      tableData.push(rowData);
    }
  }

  // Log the extracted data
  console.log('Extracted table data:', tableData);

  // Optional: Save to a file
  const fs = require('fs');
  fs.writeFileSync('table-data.json', JSON.stringify(tableData, null, 2));

  // Add some basic assertions
  expect(tableData.length).toBeGreaterThan(0);
}); 