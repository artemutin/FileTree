using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using FileTree.Models;
using Newtonsoft.Json;

namespace FileTree.Controllers
{
    public class TreeEntriesController : Controller
    {
        private FileTreeContext db = new FileTreeContext();

        // GET: TreeEntries
        public ActionResult Index()
        {
            return Json(
                JsonConvert.SerializeObject(db.TreeEntries.Where(x => x.Id == 1),
                    new JsonSerializerSettings {
                        ReferenceLoopHandling = ReferenceLoopHandling.Ignore,
                        Formatting = Formatting.Indented})
                , JsonRequestBehavior.AllowGet
                );
        }

        // GET: TreeEntries/Details/5
        public ActionResult Details(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            TreeEntry treeEntry = db.TreeEntries.Find(id);
            if (treeEntry == null)
            {
                return HttpNotFound();
            }
            return View(treeEntry);
        }

        // GET: TreeEntries/Create
        public ActionResult Create()
        {
            return View();
        }

        // POST: TreeEntries/Create
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for 
        // more details see https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create([Bind(Include = "id,name,isFolder")] TreeEntry treeEntry)
        {
            if (ModelState.IsValid)
            {
                db.TreeEntries.Add(treeEntry);
                db.SaveChanges();
                return RedirectToAction("Index");
            }

            return View(treeEntry);
        }

        // GET: TreeEntries/Edit/5
        public ActionResult Edit(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            TreeEntry treeEntry = db.TreeEntries.Find(id);
            if (treeEntry == null)
            {
                return HttpNotFound();
            }
            return View(treeEntry);
        }

        // POST: TreeEntries/Edit/5
        // To protect from overposting attacks, please enable the specific properties you want to bind to, for 
        // more details see https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit([Bind(Include = "id,name,isFolder")] TreeEntry treeEntry)
        {
            if (ModelState.IsValid)
            {
                db.Entry(treeEntry).State = EntityState.Modified;
                db.SaveChanges();
                return RedirectToAction("Index");
            }
            return View(treeEntry);
        }

        // GET: TreeEntries/Delete/5
        public ActionResult Delete(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            TreeEntry treeEntry = db.TreeEntries.Find(id);
            if (treeEntry == null)
            {
                return HttpNotFound();
            }
            return View(treeEntry);
        }

        // POST: TreeEntries/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public ActionResult DeleteConfirmed(int id)
        {
            TreeEntry treeEntry = db.TreeEntries.Find(id);
            db.TreeEntries.Remove(treeEntry);
            db.SaveChanges();
            return RedirectToAction("Index");
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
