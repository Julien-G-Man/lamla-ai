#!/usr/bin/env python
"""
Test script for verifying conversation saving and file API fixes.
Run from backend directory: python test_chatbot_fixes.py
"""

import os
import sys
import django
import asyncio
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lamla.settings')
django.setup()

from django.test import AsyncClient
from apps.chatbot.models import ChatSession, ChatMessage
from django.contrib.auth.models import User


async def test_conversation_saving():
    """Test that conversations are being saved correctly"""
    print("\n" + "="*60)
    print("TEST 1: Conversation Saving")
    print("="*60)
    
    client = AsyncClient()
    
    # Clear previous sessions
    ChatSession.objects.all().delete()
    
    # Send a message
    print("\n1. Sending message to chatbot...")
    response = await client.post(
        '/api/chat/',
        {'message': 'What is photosynthesis?'},
        content_type='application/json'
    )
    
    if response.status_code == 200:
        print(f"   ✓ Response status: {response.status_code}")
        print(f"   ✓ Response: {response.json()}")
    else:
        print(f"   ✗ Error: {response.status_code}")
        print(f"   ✗ Response: {response.content}")
        return False
    
    # Check history
    print("\n2. Checking conversation history...")
    response = await client.get('/api/history/')
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Response status: {response.status_code}")
        print(f"   ✓ Message count: {data['message_count']}")
        print(f"   ✓ Session ID: {data['session_id']}")
        
        if data['message_count'] >= 2:
            print(f"   ✓ Both user and AI messages saved!")
            for msg in data['messages']:
                print(f"      - {msg['sender']}: {msg['content'][:50]}...")
            return True
        else:
            print(f"   ✗ Expected 2+ messages, got {data['message_count']}")
            return False
    else:
        print(f"   ✗ Error: {response.status_code}")
        print(f"   ✗ Response: {response.content}")
        return False


async def test_conversation_persistence():
    """Test that conversations persist across requests"""
    print("\n" + "="*60)
    print("TEST 2: Conversation Persistence")
    print("="*60)
    
    client = AsyncClient()
    
    # Get initial message count
    response1 = await client.get('/api/history/')
    if response1.status_code != 200:
        print("   ✗ Failed to get history")
        return False
    
    initial_count = response1.json()['message_count']
    print(f"\n1. Initial message count: {initial_count}")
    
    # Send another message
    print("\n2. Sending second message...")
    response = await client.post(
        '/api/chat/',
        {'message': 'What is cellular respiration?'},
        content_type='application/json'
    )
    
    if response.status_code != 200:
        print(f"   ✗ Error: {response.status_code}")
        return False
    print("   ✓ Message sent")
    
    # Check message count increased
    print("\n3. Checking message count increased...")
    response2 = await client.get('/api/history/')
    
    if response2.status_code != 200:
        print("   ✗ Failed to get history")
        return False
    
    new_count = response2.json()['message_count']
    print(f"   ✓ New message count: {new_count}")
    
    if new_count > initial_count:
        print(f"   ✓ Message count increased from {initial_count} to {new_count}")
        return True
    else:
        print(f"   ✗ Message count did not increase")
        return False


async def test_database_integrity():
    """Test that messages are actually saved to database"""
    print("\n" + "="*60)
    print("TEST 3: Database Integrity")
    print("="*60)
    
    # Count messages in DB
    total_messages = ChatMessage.objects.count()
    print(f"\n1. Total messages in database: {total_messages}")
    
    # Check message types
    user_messages = ChatMessage.objects.filter(sender='user').count()
    ai_messages = ChatMessage.objects.filter(sender='ai').count()
    
    print(f"2. User messages: {user_messages}")
    print(f"3. AI messages: {ai_messages}")
    
    if total_messages > 0 and user_messages > 0 and ai_messages > 0:
        print("   ✓ Database contains both user and AI messages")
        
        # Show latest message
        latest = ChatMessage.objects.latest('created_at')
        print(f"\n4. Latest message:")
        print(f"   - Sender: {latest.sender}")
        print(f"   - Content: {latest.content[:100]}...")
        print(f"   - Created: {latest.created_at}")
        
        return True
    else:
        print("   ✗ Missing message types in database")
        return False


async def test_clear_history():
    """Test the clear history endpoint"""
    print("\n" + "="*60)
    print("TEST 4: Clear History")
    print("="*60)
    
    client = AsyncClient()
    
    # Get current count
    response1 = await client.get('/api/history/')
    if response1.status_code != 200:
        print("   ✗ Failed to get history")
        return False
    
    current_count = response1.json()['message_count']
    print(f"\n1. Current message count: {current_count}")
    
    if current_count == 0:
        print("   ⓘ No messages to clear, skipping test")
        return True
    
    # Clear history
    print("\n2. Clearing history...")
    response = await client.delete('/api/history/clear/')
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Cleared {data['deleted_count']} messages")
    else:
        print(f"   ✗ Error: {response.status_code}")
        return False
    
    # Check count is now 0
    print("\n3. Checking message count...")
    response2 = await client.get('/api/history/')
    
    if response2.status_code != 200:
        print("   ✗ Failed to get history")
        return False
    
    new_count = response2.json()['message_count']
    print(f"   ✓ New message count: {new_count}")
    
    if new_count == 0:
        print("   ✓ History cleared successfully")
        return True
    else:
        print(f"   ✗ History not cleared (count: {new_count})")
        return False


async def run_all_tests():
    """Run all tests"""
    print("\n" + "#"*60)
    print("# CHATBOT FIXES TEST SUITE")
    print("#"*60)
    
    results = []
    
    try:
        results.append(("Conversation Saving", await test_conversation_saving()))
        results.append(("Conversation Persistence", await test_conversation_persistence()))
        results.append(("Database Integrity", await test_database_integrity()))
        results.append(("Clear History", await test_clear_history()))
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    print(f"\nTotal: {passed}/{total} passed")
    
    if passed == total:
        print("\n✓ All tests passed!")
        return True
    else:
        print(f"\n✗ {total - passed} test(s) failed")
        return False


if __name__ == '__main__':
    try:
        success = asyncio.run(run_all_tests())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
