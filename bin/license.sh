for f in $(find ./src -name '*.js'); do
  if (grep Copyright $f);then
    echo "No need to copy the License Header to $f"
  else
    cat LICENSE $f > $f.new
    mv $f.new $f
    echo "License Header copied to $f"
  fi
done

for f in $(find ./server -name '*.js'); do
  if (grep Copyright $f);then
    echo "No need to copy the License Header to $f"
  else
    cat LICENSE $f > $f.new
    mv $f.new $f
    echo "License Header copied to $f"
  fi
done
