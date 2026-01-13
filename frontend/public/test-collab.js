/**
 * Yjs Collaboration Automated Test Suite
 * Run this in browser console after opening the editor
 */

(function() {
  console.log('🧪 Yjs Collaboration Test Suite v1.0');
  console.log('=====================================\n');

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
  };

  function assert(condition, message, severity = 'error') {
    const test = { message, passed: condition, severity };
    results.tests.push(test);
    
    if (condition) {
      results.passed++;
      console.log(`✅ ${message}`);
    } else {
      if (severity === 'warning') {
        results.warnings++;
        console.warn(`⚠️  ${message}`);
      } else {
        results.failed++;
        console.error(`❌ ${message}`);
      }
    }
  }

  function testCollaborationStore() {
    console.log('\n📦 Testing Collaboration Store...');
    
    try {
      const store = useCollaborationStore.getState();
      
      assert(store !== undefined, 'Collaboration store should exist');
      assert(typeof store.connect === 'function', 'connect() method should exist');
      assert(typeof store.disconnect === 'function', 'disconnect() method should exist');
      assert(typeof store.joinDocument === 'function', 'joinDocument() method should exist');
      assert(typeof store.leaveDocument === 'function', 'leaveDocument() method should exist');
      
      // Test state
      assert(
        ['connected', 'connecting', 'disconnected'].includes(store.status),
        `Status should be valid (got: ${store.status})`
      );
      
      assert(Array.isArray(store.participants), 'Participants should be an array');
      
      // Test metrics structure
      assert(store.metrics !== null, 'Metrics should exist');
      assert(typeof store.metrics.disconnectCount === 'number', 'Disconnect count should be a number');
      
    } catch (error) {
      assert(false, `Store test failed: ${error.message}`);
    }
  }

  function testConnection() {
    console.log('\n🔌 Testing Connection...');
    
    try {
      const store = useCollaborationStore.getState();
      
      assert(
        store.status === 'connected',
        `Connection should be active (current: ${store.status})`,
        store.status === 'connecting' ? 'warning' : 'error'
      );
      
      if (store.status === 'connected') {
        assert(store.socket !== null, 'Socket instance should exist');
        assert(store.socket.connected === true, 'Socket should be connected');
        assert(store.socket.id !== undefined, 'Socket should have an ID');
      }
      
    } catch (error) {
      assert(false, `Connection test failed: ${error.message}`);
    }
  }

  function testUserProfile() {
    console.log('\n👤 Testing User Profile...');
    
    try {
      const store = useCollaborationStore.getState();
      const user = store.currentUser;
      
      assert(user !== null, 'User profile should exist');
      
      if (user) {
        assert(typeof user.id === 'string' && user.id.length > 0, 'User should have valid ID');
        assert(typeof user.name === 'string' && user.name.length > 0, 'User should have valid name');
        assert(typeof user.initials === 'string' && user.initials.length > 0, 'User should have initials');
        assert(typeof user.color === 'string' && user.color.match(/^#[0-9a-f]{6}$/i), 'User should have valid hex color');
        
        console.log(`   User: ${user.name} (${user.initials}) - ${user.color}`);
      }
      
    } catch (error) {
      assert(false, `User profile test failed: ${error.message}`);
    }
  }

  function testMetrics() {
    console.log('\n📊 Testing Metrics...');
    
    try {
      const store = useCollaborationStore.getState();
      const metrics = store.metrics;
      
      assert(metrics !== null, 'Metrics object should exist');
      
      if (metrics.lastConnectLatencyMs !== null) {
        assert(
          metrics.lastConnectLatencyMs >= 0 && metrics.lastConnectLatencyMs < 5000,
          `Connect latency should be reasonable (${metrics.lastConnectLatencyMs}ms)`,
          metrics.lastConnectLatencyMs > 1000 ? 'warning' : 'error'
        );
      }
      
      if (metrics.lastServerAckMs !== null) {
        assert(
          metrics.lastServerAckMs >= 0 && metrics.lastServerAckMs < 1000,
          `Server ack latency should be reasonable (${metrics.lastServerAckMs}ms)`,
          metrics.lastServerAckMs > 200 ? 'warning' : 'error'
        );
      }
      
      if (metrics.lastRemoteUpdateLagMs !== null) {
        assert(
          metrics.lastRemoteUpdateLagMs >= 0 && metrics.lastRemoteUpdateLagMs < 1000,
          `Remote update lag should be reasonable (${metrics.lastRemoteUpdateLagMs}ms)`,
          metrics.lastRemoteUpdateLagMs > 300 ? 'warning' : 'error'
        );
      }
      
      assert(
        metrics.disconnectCount < 5,
        `Disconnect count should be low (${metrics.disconnectCount})`,
        metrics.disconnectCount > 0 ? 'warning' : 'error'
      );
      
      console.log('   Metrics:', JSON.stringify(metrics, null, 2));
      
    } catch (error) {
      assert(false, `Metrics test failed: ${error.message}`);
    }
  }

  function testPresence() {
    console.log('\n👥 Testing Presence...');
    
    try {
      const store = useCollaborationStore.getState();
      const participants = store.participants;
      
      assert(Array.isArray(participants), 'Participants should be an array');
      
      console.log(`   Found ${participants.length} participant(s)`);
      
      participants.forEach((participant, index) => {
        assert(
          typeof participant.id === 'string' && participant.id.length > 0,
          `Participant ${index} should have valid ID`
        );
        assert(
          typeof participant.name === 'string',
          `Participant ${index} should have name`
        );
        assert(
          typeof participant.initials === 'string',
          `Participant ${index} should have initials`
        );
        assert(
          typeof participant.color === 'string' && participant.color.match(/^#[0-9a-f]{6}$/i),
          `Participant ${index} should have valid color`
        );
        
        console.log(`   ${index + 1}. ${participant.name} (${participant.initials}) - ${participant.color}`);
      });
      
    } catch (error) {
      assert(false, `Presence test failed: ${error.message}`);
    }
  }

  function testDocumentFunctions() {
    console.log('\n📄 Testing Document Functions...');
    
    try {
      // Test if functions exist in global scope
      assert(typeof getDocument === 'function', 'getDocument() should be available', 'warning');
      assert(typeof getDocumentText === 'function', 'getDocumentText() should be available', 'warning');
      assert(typeof getAwareness === 'function', 'getAwareness() should be available', 'warning');
      assert(typeof createDocumentId === 'function', 'createDocumentId() should be available', 'warning');
      
    } catch (error) {
      console.log('   Note: Document functions may not be exposed globally');
    }
  }

  function testActiveDocument() {
    console.log('\n📝 Testing Active Document...');
    
    try {
      const store = useCollaborationStore.getState();
      
      if (store.activeDocumentId) {
        console.log(`   Active document: ${store.activeDocumentId}`);
        
        assert(
          typeof store.activeDocumentId === 'string' && store.activeDocumentId.includes('::'),
          'Active document ID should have correct format (workspace::filepath)'
        );
        
        if (store.lastRemoteUpdate) {
          const timeSinceUpdate = Date.now() - store.lastRemoteUpdate.timestamp;
          console.log(`   Last remote update: ${timeSinceUpdate}ms ago`);
        }
      } else {
        console.log('   No active document (join a document to test)');
      }
      
    } catch (error) {
      assert(false, `Active document test failed: ${error.message}`);
    }
  }

  function generateReport() {
    console.log('\n');
    console.log('=====================================');
    console.log('📋 Test Report');
    console.log('=====================================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️  Warnings: ${results.warnings}`);
    console.log(`📊 Total: ${results.tests.length}`);
    
    if (results.failed === 0 && results.warnings === 0) {
      console.log('\n🎉 All tests passed!');
    } else if (results.failed === 0) {
      console.log('\n✨ All critical tests passed (with warnings)');
    } else {
      console.log('\n❗ Some tests failed - review errors above');
    }
    
    console.log('=====================================\n');
    
    return results;
  }

  // Run all tests
  try {
    testCollaborationStore();
    testConnection();
    testUserProfile();
    testMetrics();
    testPresence();
    testDocumentFunctions();
    testActiveDocument();
  } catch (error) {
    console.error('💥 Test suite crashed:', error);
  }
  
  // Generate report
  const finalResults = generateReport();
  
  // Return results for programmatic access
  window.__yjsTestResults = finalResults;
  
  console.log('💡 Tip: Access results via window.__yjsTestResults');
  console.log('💡 Tip: Re-run tests with: window.__runYjsTests()');
  
  // Save test runner for re-execution
  window.__runYjsTests = () => {
    location.reload(); // Simple reload to re-run
  };
  
})();
