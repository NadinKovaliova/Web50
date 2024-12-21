from django.shortcuts import render, redirect
from markdown2 import markdown
from . import util
from django import forms
from django.http import HttpResponseBadRequest
import random

def index(request):
    return render(request, "encyclopedia/index.html", {
        "entries": util.list_entries()
    })

def entry_page(request, title):
    entries = util.list_entries()

    for entry in entries:
        if entry.lower() == title.lower():
            entry_content = util.get_entry(entry)
            entry_html = markdown(entry_content)

            return render(request, "encyclopedia/entry.html", {
                "title": entry,
                "content": entry_html
            })
    
    return render(request, "encyclopedia/error.html", {
        "message": f"The requested page 'title' was not found."
    })

def search(request):
    query = request.GET.get('q', '').strip()

    if not query:
        return redirect("index")
    entries = util.list_entries()
    matching_entries = [entry for entry in entries if query.lower() in entry.lower()]

    for entry in entries:
        if entry.lower() == query.lower():
            return redirect("entry_page", title=entry)
        
    return render(request, "encyclopedia/search.html", {
        "query": query,
        "results": matching_entries
    })

class NewPageForm(forms.Form):
    title = forms.CharField(label="Title", max_length=100, widget=forms.TextInput(attrs={'class': 'form-control'}))
    content = forms.CharField(
        label="Content",
        widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 10})
    )

def create_page(request):
    if request.method == "POST":
        form = NewPageForm(request.POST)
        if form.is_valid():
            title = form.cleaned_data["title"].strip()
            content = form.cleaned_data["content"].strip()

            if title.lower() in [entry.lower() for entry in util.list_entries()]:
                return render(request, "encyclopedia/create.html", {
                    "form": form,
                    "error":f'An entry with the title "{title}" already exists.'
                })
            
            util.save_entry(title, content)
            return redirect("entry_page", title=title)
        
        else:
            return HttpResponseBadRequest("Invalid form data.")

    return render(request, "encyclopedia/create.html", {
        "form": NewPageForm()
    })

class EditPageForm(forms.Form):
    content = forms.CharField(
        label="Edit Content",
        widget=forms.Textarea(attrs={"class": "form-control", "rows": 10}),
    )

def edit_page(request, title):
    current_content = util.get_entry(title)

    if current_content is None:
        return render(request, "encyclopedia/error.html", {
            "message": "The requested page does not exist."
        })
    
    if request.method == "POST":
        form = EditPageForm(request.POST)
        if form.is_valid():
            new_content = form.cleaned_data["content"]
            util.save_entry(title, new_content)
            return redirect("entry_page", title=title)
    else:
        form = EditPageForm(initial={"content": current_content})
    
    return render(request, "encyclopedia/edit.html", {
        "title": title,
        "form": form,
    })

def random_page(request):
    entries = util.list_entries()
    random_entry = random.choice(entries)
    return redirect("entry_page", title=random_entry)
