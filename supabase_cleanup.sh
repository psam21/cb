#!/bin/bash

echo "=== Supabase Local Cleanup Script ==="
echo

# Function for yes/no prompt
confirm() {
    while true; do
        read -p "$1 [y/n]: " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer y or n.";;
        esac
    done
}

# Step 1: Stop Supabase containers
if confirm "Stop all Supabase containers?"; then
    docker ps -a --filter "name=supabase"
    docker stop $(docker ps -aq --filter "name=supabase") 2>/dev/null
    echo "Supabase containers stopped."
else
    echo "Skipping container stop."
fi
echo

# Step 2: Remove Supabase containers
if confirm "Remove all Supabase containers?"; then
    docker rm $(docker ps -aq --filter "name=supabase") 2>/dev/null
    echo "Supabase containers removed."
else
    echo "Skipping container removal."
fi
echo

# Step 3: Remove Supabase images
if confirm "Remove all Supabase Docker images?"; then
    docker images "supabase/*" -q | xargs -r docker rmi -f
    echo "Supabase images removed."
else
    echo "Skipping Supabase image removal."
fi
echo

# Step 4: Optional remove Postgres images
if confirm "Remove Postgres image(s) used by Supabase?"; then
    docker images "postgres*" -q | xargs -r docker rmi -f
    echo "Postgres images removed."
else
    echo "Skipping Postgres image removal."
fi
echo

# Step 5: Prune dangling images and volumes
if confirm "Prune all unused Docker images, containers, and volumes?"; then
    docker system prune -a --volumes -f
    echo "Dangling images and volumes cleaned."
else
    echo "Skipping prune."
fi
echo

# Step 6: Optional uninstall Supabase CLI
if command -v supabase >/dev/null 2>&1; then
    if confirm "Uninstall Supabase CLI (npm)?"; then
        npm uninstall -g supabase
        echo "Supabase CLI uninstalled."
    else
        echo "Skipping CLI uninstall."
    fi
fi
echo

echo "=== Cleanup Complete ==="
docker ps -a
docker images
