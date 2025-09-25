// Test script to debug deletion functionality
const { exec } = require('child_process');

console.log('Testing deletion functionality...');

// Test 1: Check if the server is running
exec('curl -s http://localhost:3000/my-shop | grep -o "Loading"', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Server not responding:', error.message);
    return;
  }
  
  if (stdout.includes('Loading')) {
    console.log('✅ Server is running and page loads');
  } else {
    console.log('❌ Page not loading correctly');
  }
});

// Test 2: Check the relay query logic
console.log('\n🔍 Analyzing the soft delete filtering logic...');

// Let's examine the query filters
const filters = [
  {
    kinds: [23],
    authors: ['8b6fbea65e0ceb651251d4a0020513a471c98d61139f1501a8fe68eadcf98ec2'],
    '#t': ['culture-bridge-shop'],
  },
  {
    kinds: [23],
    authors: ['8b6fbea65e0ceb651251d4a0020513a471c98d61139f1501a8fe68eadcf98ec2'],
    // No tag filter to catch deletion events
  },
];

console.log('Query filters:', JSON.stringify(filters, null, 2));

// Test 3: Simulate the deletion event structure
const deletionEvent = {
  kind: 23,
  pubkey: '8b6fbea65e0ceb651251d4a0020513a471c98d61139f1501a8fe68eadcf98ec2',
  created_at: Math.floor(Date.now() / 1000),
  tags: [
    ['d', '8b6fbea65e0ceb651251d4a0020513a471c98d61139f1501a8fe68eadcf98ec2-1758788242-[deleted]-test-relay'],
    ['r', '1'],
    ['title', '[DELETED] Test Relay Publishing'],
    ['lang', 'en'],
    ['author', '8b6fbea65e0ceb651251d4a0020513a471c98d61139f1501a8fe68eadcf98ec2'],
    ['region', 'global'],
    ['published_at', '1758788242'],
    ['e', '7a6a882e5ad29c0ac21f8fc817f3f1536b357ea6dd0c815cc5629cd5cec3e691', 'reply'],
    ['permissions', 'public']
  ],
  content: '{"title":"[DELETED] Test Relay Publishing","content":"This product has been deleted by the author.","summary":"Product deleted","published_at":1758788242,"tags":["culture-bridge-shop","product-deletion"],"language":"en","region":"global","permissions":"public"}'
};

console.log('\nDeletion event structure:');
console.log('- Title:', deletionEvent.tags.find(t => t[0] === 'title')?.[1]);
console.log('- Has culture-bridge-shop tag:', deletionEvent.tags.some(t => t[0] === 't' && t[1] === 'culture-bridge-shop'));
console.log('- Has e tag with reply:', deletionEvent.tags.some(t => t[0] === 'e' && t[2] === 'reply'));
console.log('- Referenced event ID:', deletionEvent.tags.find(t => t[0] === 'e' && t[2] === 'reply')?.[1]);

// Test 4: Check if the deletion event would be caught by our filters
console.log('\n🔍 Filter analysis:');
console.log('Filter 1 (with culture-bridge-shop tag):', 
  deletionEvent.tags.some(t => t[0] === 't' && t[1] === 'culture-bridge-shop') ? '✅ WOULD MATCH' : '❌ WOULD NOT MATCH');

console.log('Filter 2 (no tag restriction):', 
  deletionEvent.kind === 23 && deletionEvent.pubkey === '8b6fbea65e0ceb651251d4a0020513a471c98d61139f1501a8fe68eadcf98ec2' ? '✅ WOULD MATCH' : '❌ WOULD NOT MATCH');

// Test 5: Simulate the FIXED deletion event with culture-bridge-shop tag
const fixedDeletionEvent = {
  ...deletionEvent,
  tags: [
    ...deletionEvent.tags,
    ['t', 'culture-bridge-shop'] // Add the missing tag
  ]
};

console.log('\n🔧 FIXED deletion event:');
console.log('- Has culture-bridge-shop tag:', fixedDeletionEvent.tags.some(t => t[0] === 't' && t[1] === 'culture-bridge-shop'));
console.log('Filter 1 (with culture-bridge-shop tag):', 
  fixedDeletionEvent.tags.some(t => t[0] === 't' && t[1] === 'culture-bridge-shop') ? '✅ WOULD MATCH' : '❌ WOULD NOT MATCH');

console.log('\n🎯 Conclusion: The FIXED deletion event should be caught by BOTH filters!');
