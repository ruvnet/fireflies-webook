#!/bin/bash

# Install poetry
curl -sSL https://install.python-poetry.org | python3 -

# Install project dependencies
poetry install

# Set up pre-commit hooks
poetry run pre-commit install

# Run database migrations
poetry run alembic upgrade head

echo "Installation complete. Don't forget to set up your .env file!"
