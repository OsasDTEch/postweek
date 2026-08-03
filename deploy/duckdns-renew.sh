#!/bin/bash
# Keeps DuckDNS updated with the current public IP.
# Run as a cron job: */5 * * * * /home/ubuntu/duckdns-renew.sh >> /var/log/duckdns.log 2>&1
echo url="https://www.duckdns.org/update?domains=postweek&token=807065fc-d2cf-4702-a949-1607b9f63127&ip=" | curl -k -o /tmp/duckdns.log -K -
