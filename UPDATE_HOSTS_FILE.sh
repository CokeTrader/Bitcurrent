#!/bin/bash

# Script to update /etc/hosts file to point bitcurrent.co.uk to AWS LoadBalancer
# This bypasses DNS caching issues

echo "================================================================"
echo "UPDATING /etc/hosts FILE"
echo "================================================================"
echo ""
echo "This will add entries to point bitcurrent.co.uk to AWS."
echo ""
echo "Run this command in Terminal:"
echo ""
echo "sudo sh -c 'echo \"\" >> /etc/hosts && echo \"# BitCurrent AWS LoadBalancer\" >> /etc/hosts && echo \"13.42.168.95 bitcurrent.co.uk\" >> /etc/hosts && echo \"13.43.72.181 www.bitcurrent.co.uk\" >> /etc/hosts'"
echo ""
echo "================================================================"
echo "After running the command above:"
echo "1. Enter your Mac password when prompted"
echo "2. Open Safari/Chrome (regular or incognito)"
echo "3. Visit: http://bitcurrent.co.uk"
echo "4. You should see your BitCurrent Exchange!"
echo "================================================================"
echo ""
echo "To remove these entries later (after DNS propagates):"
echo "sudo nano /etc/hosts"
echo "Delete the lines with bitcurrent.co.uk"
echo "Save with Ctrl+O, Enter, Ctrl+X"
echo "================================================================"


