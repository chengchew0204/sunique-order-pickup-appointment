#!/usr/bin/env python3
"""
Configuration verification script
Run this before deploying to ensure all environment variables are set correctly
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

# ANSI color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def check_env_var(name, required=True, secret=False):
    """Check if an environment variable is set"""
    value = os.getenv(name)
    if value:
        if secret:
            display_value = value[:4] + '...' if len(value) > 4 else '***'
        else:
            display_value = value if not secret else '***'
        print(f"{Colors.GREEN}[OK]{Colors.END} {name}: {display_value}")
        return True
    else:
        if required:
            print(f"{Colors.RED}[MISSING]{Colors.END} {name}: Required but not set")
            return False
        else:
            print(f"{Colors.YELLOW}[OPTIONAL]{Colors.END} {name}: Not set (using default)")
            return True

def main():
    print(f"\n{Colors.BOLD}{Colors.BLUE}=" * 60)
    print("Configuration Verification")
    print("=" * 60 + f"{Colors.END}\n")
    
    all_ok = True
    
    # Flask Configuration
    print(f"{Colors.BOLD}Flask Configuration:{Colors.END}")
    all_ok &= check_env_var('SECRET_KEY', required=True, secret=True)
    check_env_var('PORT', required=False)
    print()
    
    # SharePoint Configuration
    print(f"{Colors.BOLD}SharePoint Configuration:{Colors.END}")
    all_ok &= check_env_var('CLIENT_ID', required=True, secret=True)
    all_ok &= check_env_var('CLIENT_SECRET', required=True, secret=True)
    all_ok &= check_env_var('TENANT_ID', required=True, secret=True)
    all_ok &= check_env_var('SHAREPOINT_SITE_URL', required=True)
    all_ok &= check_env_var('SHAREPOINT_SITE_ID', required=True, secret=True)
    all_ok &= check_env_var('ORDERS_FILE_PATH', required=True)
    all_ok &= check_env_var('APPOINTMENTS_FILE_PATH', required=True)
    print()
    
    # Email Configuration
    print(f"{Colors.BOLD}Email Configuration:{Colors.END}")
    all_ok &= check_env_var('OUTLOOK_CLIENT_ID', required=True, secret=True)
    all_ok &= check_env_var('OUTLOOK_CLIENT_SECRET', required=True, secret=True)
    all_ok &= check_env_var('OUTLOOK_TENANT_ID', required=True, secret=True)
    all_ok &= check_env_var('OUTLOOK_SENDER_EMAIL', required=True)
    print()
    
    # Admin Configuration
    print(f"{Colors.BOLD}Admin Configuration:{Colors.END}")
    all_ok &= check_env_var('ADMIN_PASSWORD', required=True, secret=True)
    print()
    
    # Summary
    print(f"{Colors.BOLD}{Colors.BLUE}=" * 60)
    if all_ok:
        print(f"{Colors.GREEN}All required environment variables are set!{Colors.END}")
        print(f"{Colors.GREEN}Your configuration is ready for deployment.{Colors.END}")
        sys.exit(0)
    else:
        print(f"{Colors.RED}Some required environment variables are missing!{Colors.END}")
        print(f"{Colors.YELLOW}Please set the missing variables before deploying.{Colors.END}")
        sys.exit(1)
    print("=" * 60 + f"{Colors.END}\n")

if __name__ == '__main__':
    main()

